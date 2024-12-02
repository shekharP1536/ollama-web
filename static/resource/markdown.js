function convertMarkdownToHTML(md) {
  md = `${md}  `
  let inCodeBlock = false; // Track if inside a code block
  let result = '';
  // Replace <br> tags with a placeholder, split by newlines, and restore <br> tags
  const modifiedMd = md.replace(/<br>/g, '\n');
  const lines = modifiedMd.split('\n');
  // Split input into lines for processing
  const linesWithNewLine = lines.map(line => line + '\n');
  // line = linesWithNewLine
  linesWithNewLine.forEach((line) => {
    if (line.startsWith('```')) {
      if (!inCodeBlock) {
        // Beginning of a code block
        inCodeBlock = true;
        const language = line.slice(3).trim(); // Extract the language (if any)
        console.log(language);

        result += `
        <div class="code_div"><span style="margin: 10px;">${language || 'code'}</span><pre class="language-${language || 'text'}"><button class="copy-button" onclick="copyCode(this)">Copy</button><code>`;
      } else {
        // End of a code block
        inCodeBlock = false;
        result += '</code></pre></div>';
      }
    } else if (inCodeBlock) {
      result += `${line.replace(/</g, '&lt;').replace(/>/g, '&gt;')}\n`;
      // Inside a code block, add line as-is
    } else {
      // Outside of code blocks, process Markdown formatting
      result += line
        .replace(/^###### (.*$)/gm, '<h6>$1</h6>') // H6 headers
        .replace(/^##### (.*$)/gm, '<h5>$1</h5>') // H5 headers
        .replace(/^#### (.*$)/gm, '<h4>$1</h4>') // H4 headers
        .replace(/^### (.*$)/gm, '<h3>$1</h3>') // H3 headers
        .replace(/^## (.*$)/gm, '<h2>$1</h2>') // H2 headers
        .replace(/^# (.*$)/g, '<h1>$1</h1>') // H1 headers
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
        .replace(/\*(.*?)\*/g, '<em>$1</em>') // Italics
        .replace(/!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1">') // Images
        .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>') // Links
        .replace(/^\s*\n\* (.*)/gm, '<ul><li>$1</li></ul>') // Unordered lists
        .replace(/<\/ul>\s*<ul>/g, '') // Fix nested lists
        .replace(/^\s*\n\d+\. (.*)/gm, '<ol><li>$1</li></ol>') // Ordered lists
        .replace(/<\/ol>\s*<ol>/g, '') // Fix nested lists
        .replace(/^\> (.*$)/gm, '<blockquote>$1</blockquote>') // Blockquotes
        .replace(/^\-\-\-$/gm, '<hr>') // Horizontal rule
        .replace(/\n/g, '<br>'); // Line breaks
    }
  });

  final = highlightAll(result);
  return final;
} function copyCode(button) {
  // Debugging: Log the next siblings to inspect the structure
  console.log(button.nextElementSibling);

  // Find the code block
  const codeBlock = button.nextElementSibling;
  if (!codeBlock) {
    console.error("Code block not found");
    return;
  }

  const codeText = codeBlock.textContent;

  // Create a temporary input element to copy the code
  const tempInput = document.createElement('input');
  tempInput.value = codeText;
  document.body.appendChild(tempInput);
  tempInput.select();
  document.execCommand('copy');
  document.body.removeChild(tempInput);

  // Change the text to 'Copied!' after copying
  const copyText = button; // Get the span with the "Copy" text
  copyText.textContent = 'Copied!';

  // Reset the text back to "Copy" after 2 seconds
  setTimeout(() => {
    copyText.textContent = 'Copy';
  }, 2000);
}
function highlightAll(text) {
  // console.log(text);

  // Ensure the text is a valid string
  if (typeof text !== 'string') {
    console.error("Invalid argument: 'text' must be a string.");
    return text; // Return the original text if it's not a string
  }

  // Create a temporary DOM element to handle the text and its <code> blocks
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = text;  // Set the text as HTML content

  // Get all the <code> elements inside the temporary element
  const parser = new DOMParser();
  const decodedHTML = parser.parseFromString(text, 'text/html').body.innerHTML;
  tempDiv.innerHTML = decodedHTML;
  const codeElements = tempDiv.querySelectorAll('code');
  // If no <code> blocks are found, return the original text
  if (codeElements.length === 0) {
    console.log("No code blocks found.");
    return text;  // Return the text as-is if no <code> elements are present
  }

  // Process each <code> element if present
  codeElements.forEach(el => {

    // Highlight each code element using the Highlight.js library
    hljs.highlightElement(el);
  });

  // Return the modified HTML text with highlighted <code> blocks
  return tempDiv.innerHTML;
}
