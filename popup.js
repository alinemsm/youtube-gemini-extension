// Import API key from config file
// Make sure config.js is loaded before popup.js in your HTML
const GEMINI_API_KEY = window.config ? window.config.GEMINI_API_KEY : '';

// Your custom prompt template
const VIDEO_ANALYSIS_PROMPT = `

Analyze the video at the URL below and provide real information from it.
{URL}

Create a hyperlinked, timestamped guide with:
- The actual video title
- Real key points from the video with accurate timestamps
- Actual references mentioned in the video

Formatting Instructions:
- Each major point should be a separate section with a clear heading
- Include a detailed summary for each point
- Each point must include a clickable timestamp (e.g., [mm:ss])
- Add a "References" section listing all mentioned books, websites, and people
- Use Markdown for formatting

If you cannot access the video, please say so directly instead of providing a template.
`;

// Function to analyze with Gemini API
async function analyzeWithGemini(url) {
  // Clean the URL - remove any tracking parameters but keep the video ID
  const cleanUrl = url.split('&')[0]; // This keeps only the base URL with video ID
  
  console.log('Original URL:', url);
  console.log('Clean URL:', cleanUrl);
  
  // Replace {URL} with the actual URL
  const prompt = VIDEO_ANALYSIS_PROMPT.replace('{URL}', cleanUrl);
  
  console.log('Final prompt being sent:', prompt);
  
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('API Error:', error);
      throw new Error(`API returned ${response.status}: ${error}`);
    }

    const data = await response.json();
    
    if (!data.candidates || !data.candidates[0]) {
      throw new Error('No response generated');
    }
    
    return data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error('Gemini API Error:', error);
    throw error;
  }
}

// Function to display results
function displayResults(text) {
  const statusDiv = document.getElementById('status');
  const resultDiv = document.getElementById('result');
  
  statusDiv.textContent = 'Analysis complete!';
  statusDiv.classList.remove('error');
  
  // Format the response with basic markdown support
  const formattedText = text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>')
    .replace(/•/g, '&bull;')
    .replace(/\[(\d+:\d+)\]/g, '<a href="#" onclick="return false;">[$1]</a>'); // Format timestamps
  
  resultDiv.innerHTML = formattedText;
  resultDiv.classList.add('show');
}

// Main event listener
document.addEventListener('DOMContentLoaded', function() {
  const analyzeBtn = document.getElementById('analyzeBtn');
  const statusDiv = document.getElementById('status');
  const resultDiv = document.getElementById('result');

  analyzeBtn.addEventListener('click', async function() {
    try {
      // Get current tab - ensure we're getting the active tab
      const [tab] = await chrome.tabs.query({ 
        active: true, 
        currentWindow: true,
        url: "*://www.youtube.com/*"  // Specifically look for YouTube tabs
      });
      
      console.log('Tab info:', tab);
      
      // Check if we got a tab
      if (!tab) {
        const [anyTab] = await chrome.tabs.query({ active: true, currentWindow: true });
        console.log('Current tab URL:', anyTab?.url);
        statusDiv.textContent = 'Please navigate to a YouTube video';
        statusDiv.classList.add('error');
        return;
      }
      
      // Check if it's a YouTube video URL
      if (!tab.url.includes('youtube.com/watch?v=')) {
        statusDiv.textContent = 'Please navigate to a YouTube video (not a playlist or channel)';
        statusDiv.classList.add('error');
        return;
      }

      // Update UI
      analyzeBtn.disabled = true;
      statusDiv.textContent = 'Analyzing video...';
      statusDiv.classList.remove('error');
      resultDiv.classList.remove('show');
      resultDiv.innerHTML = ''; // Clear previous results

      // Send to Gemini
      const response = await analyzeWithGemini(tab.url);
      
      // Display results
      displayResults(response);
      
    } catch (error) {
      console.error('Error:', error);
      statusDiv.textContent = 'Error: ' + error.message;
      statusDiv.classList.add('error');
      
      // Check for common issues
      if (error.message.includes('401')) {
        statusDiv.textContent = 'Error: Invalid API key. Please check your Gemini API key.';
      } else if (error.message.includes('403')) {
        statusDiv.textContent = 'Error: API key lacks permission. Enable Gemini API in Google Cloud Console.';
      } else if (error.message.includes('429')) {
        statusDiv.textContent = 'Error: Rate limit exceeded. Please try again later.';
      }
    } finally {
      analyzeBtn.disabled = false;
    }
  });
});