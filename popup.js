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
- Add the below at the end of the guide.
---
*Generated with [Geminize](https://deep-thinking.ai/experiments) - Chrome extension for AI-powered video analysis*
`;

document.addEventListener('DOMContentLoaded', function() {
  const analyzeBtn = document.getElementById('analyzeBtn');
  const instructionDiv = document.querySelector('.instruction p');
  const secondaryNoteDiv = document.querySelector('.secondary-note p');

  analyzeBtn.addEventListener('click', async function() {
    try {
      // Get current tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      // Check if it's a YouTube URL
      if (!tab.url || !tab.url.includes('youtube.com/watch')) {
        instructionDiv.textContent = 'Please navigate to a YouTube video first';
        instructionDiv.style.color = '#dc3545';
        return;
      }

      // Extract video title for better UX
      const videoTitle = tab.title.replace(' - YouTube', '');

      // Update UI
      analyzeBtn.disabled = true;
      instructionDiv.textContent = 'Preparing prompt...';
      instructionDiv.style.color = '#64748b';

      // Create the prompt with the current URL
      const prompt = VIDEO_ANALYSIS_PROMPT.replace('{URL}', tab.url);
      
      // Copy prompt to clipboard
      await navigator.clipboard.writeText(prompt);
      
      // Open Gemini in a new tab
      chrome.tabs.create({ url: 'https://gemini.google.com/' });
      
      // Update instruction with success message
      instructionDiv.innerHTML = '<strong style="color: #10b981;">✓ Prompt copied! Gemini opened in new tab.</strong>';
      
      // Update secondary note with next steps
      secondaryNoteDiv.innerHTML = `
        <strong>Next steps:</strong><br>
        1. Click in Gemini's message box<br>
        2. Press <kbd style="background: #e2e8f0; padding: 2px 6px; border-radius: 3px;">Ctrl+V</kbd> (or <kbd style="background: #e2e8f0; padding: 2px 6px; border-radius: 3px;">Cmd+V</kbd> on Mac)<br>
        3. Press <kbd style="background: #e2e8f0; padding: 2px 6px; border-radius: 3px;">Enter</kbd> to analyze
      `;
      
    } catch (error) {
      console.error('Error:', error);
      instructionDiv.textContent = 'Error: ' + error.message;
      instructionDiv.style.color = '#dc3545';
    } finally {
      analyzeBtn.disabled = false;
      analyzeBtn.textContent = 'Copy & Open in Gemini';
    }
  });
});