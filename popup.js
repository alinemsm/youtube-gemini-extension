// Your custom prompt template
const VIDEO_ANALYSIS_PROMPT = `
Action: Create a hyperlinked, timestamped guide for the YouTube video provided.

Video URL:
{URL}

Focus of the Guide:
[e.g., Key tips and tricks, Main arguments, Step-by-step instructions, Core concepts]

Formatting Instructions:
- The output should be a structured guide, not a simple paragraph.
- Each major point from the video should be a separate section with a clear heading.
- Include a detailed summary for each point.
- Each point must include a clickable timestamp (e.g., [mm:ss]) that links to the exact moment in the video.
- At the end of the guide, add a section titled "References".
- This "References" section should list all mentioned books, websites, and people, with a timestamp for each reference if available.
- Use Markdown for formatting (bolding, lists, etc.) to improve readability.
`;

document.addEventListener('DOMContentLoaded', function() {
  const analyzeBtn = document.getElementById('analyzeBtn');
  const statusDiv = document.getElementById('status');
  const resultDiv = document.getElementById('result');

  analyzeBtn.addEventListener('click', async function() {
    try {
      // Get current tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      // Check if it's a YouTube URL
      if (!tab.url || !tab.url.includes('youtube.com/watch')) {
        statusDiv.textContent = 'Please navigate to a YouTube video';
        statusDiv.classList.add('error');
        return;
      }

      // Extract video title for better UX
      const videoTitle = tab.title.replace(' - YouTube', '');

      // Update UI
      analyzeBtn.disabled = true;
      statusDiv.textContent = 'Preparing prompt...';
      statusDiv.classList.remove('error');

      // Create the prompt with the current URL
      const prompt = VIDEO_ANALYSIS_PROMPT.replace('{URL}', tab.url);
      
      // Copy prompt to clipboard
      await navigator.clipboard.writeText(prompt);
      
      // Open Gemini in a new tab
      chrome.tabs.create({ url: 'https://gemini.google.com/' });
      
      // Update status with clear instructions
      statusDiv.innerHTML = `
        <div style="background: #e8f5e9; padding: 10px; border-radius: 4px; margin-bottom: 10px;">
          <strong style="color: #2e7d32;">✓ Prompt copied to clipboard!</strong>
        </div>
        
        <strong>Next steps:</strong>
        <ol style="margin: 10px 0; padding-left: 20px; text-align: left;">
          <li>Gemini is now open in a new tab</li>
          <li>Click in the message box</li>
          <li>Press <kbd style="background: #eee; padding: 2px 6px; border-radius: 3px;">Ctrl+V</kbd> (or <kbd style="background: #eee; padding: 2px 6px; border-radius: 3px;">Cmd+V</kbd> on Mac)</li>
          <li>Press <kbd style="background: #eee; padding: 2px 6px; border-radius: 3px;">Enter</kbd> to analyze</li>
        </ol>
        
        <div style="background: #f5f5f5; padding: 8px; border-radius: 4px; font-size: 12px;">
          <strong>Video:</strong> ${videoTitle}<br>
          <strong>URL:</strong> <span style="color: #666;">${tab.url.substring(0, 50)}...</span>
        </div>
      `;
      
      // Add a "Copy Again" button
      setTimeout(() => {
        const copyAgainBtn = document.createElement('button');
        copyAgainBtn.textContent = 'Copy Prompt Again';
        copyAgainBtn.style.cssText = 'margin-top: 10px; padding: 8px 16px; background: #fff; border: 1px solid #ddd; border-radius: 4px; cursor: pointer;';
        copyAgainBtn.onclick = async () => {
          await navigator.clipboard.writeText(prompt);
          copyAgainBtn.textContent = '✓ Copied!';
          setTimeout(() => {
            copyAgainBtn.textContent = 'Copy Prompt Again';
          }, 2000);
        };
        statusDiv.appendChild(copyAgainBtn);
      }, 100);
      
    } catch (error) {
      console.error('Error:', error);
      statusDiv.textContent = 'Error: ' + error.message;
      statusDiv.classList.add('error');
    } finally {
      analyzeBtn.disabled = false;
      analyzeBtn.textContent = 'Send Another Video';
    }
  });
});