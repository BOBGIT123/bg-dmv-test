import puppeteer from 'puppeteer';
import { storage } from '../storage';

export interface AppointmentSlot {
  location: string;
  date: string;
  time: string;
  url: string;
}

export class AppointmentChecker {
  private browser: puppeteer.Browser | null = null;

  async initialize() {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor',
          '--disable-extensions',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding',
          '--disable-field-trial-config',
          '--disable-ipc-flooding-protection'
        ],
      });
    }
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  private getNextWorkingDays(count: number, businessDaysOnly: boolean): Date[] {
    const days: Date[] = [];
    const today = new Date();
    let day = new Date(today);

    while (days.length < count) {
      if (!businessDaysOnly || (day.getDay() !== 0 && day.getDay() !== 6)) {
        days.push(new Date(day));
      }
      day.setDate(day.getDate() + 1);
    }

    return days;
  }

  async checkAppointments(): Promise<AppointmentSlot[]> {
    await this.initialize();
    
    const locations = await storage.getDmvLocations();
    const enabledLocations = locations.filter(loc => loc.enabled);
    const settings = await storage.getMonitoringSettings();
    
    if (!settings) {
      throw new Error('Monitoring settings not found');
    }

    const targetDates = this.getNextWorkingDays(settings.daysAhead, settings.businessDaysOnly);
    const availableSlots: AppointmentSlot[] = [];

    const page = await this.browser!.newPage();

    try {
      for (const location of enabledLocations) {
        console.log(`Checking ${location.name} at ${location.url}`);
        
        try {
          await page.goto(location.url, { 
            waitUntil: 'networkidle2',
            timeout: 30000 
          });

          // Wait for dynamic content to load
          await page.waitForDelay(5000);

          // Look for available appointment slots
          // Waitwell pages typically show available slots with classes like 'available', 'time-slot', or in calendar format
          const slots = await page.$$eval('.available, .time-slot, [data-available="true"], .calendar-day.available', 
            (elements) => {
              return elements.map(el => ({
                text: el.textContent?.trim() || '',
                innerHTML: el.innerHTML,
                className: el.className
              }));
            }
          ).catch(() => []);

          // Check for appointment slots in various formats
          for (const slot of slots) {
            const text = slot.text;
            
            // Try to parse date/time from text patterns
            for (const targetDate of targetDates) {
              const dateFormats = [
                targetDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
                targetDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                targetDate.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' }),
                `${targetDate.getMonth() + 1}/${targetDate.getDate()}`,
                `${targetDate.getDate()}`,
              ];

              const timePatterns = [
                /\d{1,2}:\d{2}\s*(AM|PM)/i,
                /\d{1,2}(AM|PM)/i,
              ];

              // Check if this slot matches any target date
              const matchesDate = dateFormats.some(format => text.includes(format));
              const hasTime = timePatterns.some(pattern => pattern.test(text));

              if (matchesDate && (hasTime || text.toLowerCase().includes('available'))) {
                availableSlots.push({
                  location: location.name,
                  date: targetDate.toISOString().split('T')[0],
                  time: text,
                  url: location.url,
                });
              }
            }
          }

          // Alternative: Look for calendar elements or booking buttons
          const calendarSlots = await page.$$eval('.calendar-cell, .booking-slot, .appointment-time', 
            (elements) => {
              return elements.filter(el => {
                const isAvailable = !el.classList.contains('disabled') && 
                                  !el.classList.contains('unavailable') &&
                                  !el.hasAttribute('disabled');
                return isAvailable && el.textContent?.trim();
              }).map(el => ({
                text: el.textContent?.trim() || '',
                date: el.getAttribute('data-date') || '',
                time: el.getAttribute('data-time') || '',
              }));
            }
          ).catch(() => []);

          for (const slot of calendarSlots) {
            if (slot.date || slot.time) {
              availableSlots.push({
                location: location.name,
                date: slot.date || new Date().toISOString().split('T')[0],
                time: slot.time || slot.text,
                url: location.url,
              });
            }
          }

        } catch (error) {
          console.error(`Error checking ${location.name}:`, error);
          
          // Log the error as an activity
          await storage.createActivityLog({
            type: 'error',
            title: `Error checking ${location.name}`,
            description: `Failed to check appointments: ${error instanceof Error ? error.message : 'Unknown error'}`,
            metadata: JSON.stringify({ locationId: location.id, url: location.url }),
          });
        }
      }

    } finally {
      await page.close();
    }

    return availableSlots;
  }
}

export const appointmentChecker = new AppointmentChecker();
