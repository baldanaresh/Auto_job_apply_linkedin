const puppeteer = require('puppeteer');

(async () => {
  const user = {
    email: 'your-email@example.com',
    password: 'your-password',
  };

  const browser = await puppeteer.launch({ headless: false }); // Change to true for headless mode
  const page = await browser.newPage();

  try {
    console.log('Logging in to LinkedIn...');
    
    // Set global timeout for page interactions
    await page.setDefaultTimeout(120000); // Increased timeout to 120 seconds

    // Navigate to LinkedIn login page
    await page.goto('https://www.linkedin.com/login', { waitUntil: 'domcontentloaded', timeout: 120000 });

    // Wait for login form elements to be available
    await page.waitForSelector('#username', { timeout: 15000 });
    await page.waitForSelector('#password', { timeout: 15000 });

    // Enter login credentials
    await page.type('#username', user.email, { delay: 50 });
    await page.type('#password', user.password, { delay: 50 });
    await page.click('[type="submit"]');

    // Wait for the main page to load after logging in
    await page.waitForSelector('.global-nav__me', { timeout: 120000 }); // Wait for a specific element that indicates login success
    console.log('Login successful!');

    // Navigate to jobs page
    console.log('Navigating to Jobs page...');
    await page.goto('https://www.linkedin.com/jobs/', { waitUntil: 'networkidle2', timeout: 120000 });

    // Wait for the jobs search box to load
    await page.waitForSelector('.jobs-search-box__text-input', { timeout: 15000 }); // Ensure search bar is loaded
    console.log('Jobs page loaded.');

    // Search for jobs
    const jobTitle = 'Software Engineer'; // Change this to your desired job title
    const location = 'Remote'; // Change this to your desired location

    // Use more general selectors if necessary
    await page.type('.jobs-search-box__text-input', jobTitle, { delay: 50 });

    // Check if the location input is available
    const locationInputSelector = '.jobs-search-box__text-input--location';
    try {
      await page.waitForSelector(locationInputSelector, { timeout: 15000 });
      await page.type(locationInputSelector, location, { delay: 50 });
    } catch (error) {
      console.error('Location input not found. Skipping location input.');
    }

    // Press Enter to submit the search
    await page.keyboard.press('Enter');
    console.log('Search submitted by pressing Enter.');

    // Wait for job listings to load
    await page.waitForSelector('.job-card-container', { timeout: 60000 });
    console.log('Job listings loaded.');

    // Get job cards
    const jobCards = await page.$$('.job-card-container');

    for (let jobCard of jobCards) {
      try {
        // Use more general selectors to find job title and company name
        const jobTitle = await jobCard.$eval('h3', el => el.innerText || el.textContent);
        const companyName = await jobCard.$eval('.base-search-card__subtitle', el => el.innerText || el.textContent);
        const jobLink = await jobCard.$eval('a', el => el.href);

        console.log(`Applying for ${jobTitle} at ${companyName}...`);

        // Open job link in a new tab
        const newPage = await browser.newPage();
        await newPage.goto(jobLink, { waitUntil: 'networkidle2' });

        // Wait for the application form to load
        await newPage.waitForSelector('button[type="submit"]', { timeout: 15000 });

        // Submit the application directly
        const submitButton = await newPage.$('button[type=" submit"]');
        if (submitButton) {
          await submitButton.click();
          console.log(`Successfully applied for ${jobTitle} at ${companyName}.`);
        } else {
          console.log(`Could not find the submit button for ${jobTitle}.`);
        }

        // Close the job application tab
        await newPage.close();
      } catch (error) {
        console.error('An error occurred while processing job card:', error);
      }
    }

  } catch (error) {
    console.error('An error occurred:', error);
  } finally {
    await browser.close();
  }
})();