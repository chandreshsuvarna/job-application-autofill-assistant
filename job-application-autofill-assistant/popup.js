document.addEventListener('DOMContentLoaded', () => {
  const fields = ['fullName', 'email', 'jobTitle', 'city', 'exp', 'currentCtc', 'expectedCtc', 'notice', 'phone'];

  // Restore saved data
  chrome.storage.local.get(fields, (data) => {
    fields.forEach(f => {
      if (data[f] !== undefined && document.getElementById(f)) {
        document.getElementById(f).value = data[f];
      }
    });
  });

  const saveProfile = (callback) => {
    const profile = {};
    fields.forEach(f => {
      const el = document.getElementById(f);
      if (el) profile[f] = el.value.trim();
    });
    chrome.storage.local.set(profile, callback);
  };

  document.getElementById('saveBtn').addEventListener('click', () => {
    saveProfile(() => alert('Preferences Saved!'));
  });

  // Naukri Search & Open
  document.getElementById('openNaukri').addEventListener('click', () => {
    saveProfile(() => {
      const title = document.getElementById('jobTitle').value.trim().toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');
      const city = document.getElementById('city').value.trim().toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');
      
      const targetUrl = `https://www.naukri.com/${title}-jobs-in-${city}`;
      chrome.tabs.create({ url: targetUrl });
    });
  });

  // LinkedIn Search & Open
  document.getElementById('openLinkedIn').addEventListener('click', () => {
    saveProfile(() => {
      const title = document.getElementById('jobTitle').value.trim();
      const city = document.getElementById('city').value.trim();
      
      const targetUrl = `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(title)}&location=${encodeURIComponent(city)}&f_AL=true`;
      chrome.tabs.create({ url: targetUrl });
    });
  });

  // Shine Search & Open
  document.getElementById('openShine').addEventListener('click', () => {
    saveProfile(() => {
      const title = document.getElementById('jobTitle').value.trim();
      const city = document.getElementById('city').value.trim();
      
      const targetUrl = `https://www.shine.com/job-search/${encodeURIComponent(title)}-jobs-in-${encodeURIComponent(city)}`;
      chrome.tabs.create({ url: targetUrl });
    });
  });

  // Indeed Search & Open
  document.getElementById('openIndeed').addEventListener('click', () => {
    saveProfile(() => {
      const title = document.getElementById('jobTitle').value.trim();
      const city = document.getElementById('city').value.trim();
      const targetUrl = `https://in.indeed.com/jobs?q=${encodeURIComponent(title)}&l=${encodeURIComponent(city)}`;
      chrome.tabs.create({ url: targetUrl });
    });
  });

  // Michael Page Search & Open
  document.getElementById('openMichaelPage').addEventListener('click', () => {
    saveProfile(() => {
      const slug = (s) => s.trim().toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');
      const title = slug(document.getElementById('jobTitle').value);
      const city = slug(document.getElementById('city').value);
      let targetUrl = 'https://www.michaelpage.co.in/jobs';
      if (title && city) targetUrl += `/${title}/${city}`;
      else if (title || city) targetUrl += `/${title || city}`;
      chrome.tabs.create({ url: targetUrl });
    });
  });
});
