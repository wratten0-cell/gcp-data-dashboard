const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

/**
 * Connects to the SSE streaming chat endpoint and streams thoughts, content, SQL, and suggestions.
 */
export async function streamChatResponse({ message, history, onThought, onContent, onSql, onSuggestions, onDone, onError }) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
      },
      body: JSON.stringify({ message, history }),
    });

    if (!response.ok) {
      throw new Error(`Chat API responded with status ${response.status}: ${response.statusText}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop(); // Keep last incomplete line

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        if (trimmed.startsWith('data:')) {
          let jsonStr = trimmed;
          while (jsonStr.startsWith('data:')) {
            jsonStr = jsonStr.substring(5).trim();
          }

          if (!jsonStr) continue;

          try {
            const data = JSON.parse(jsonStr);

            if (data.type === 'THOUGHT' && onThought) {
              onThought(data.content);
            } else if (data.type === 'FINAL_RESPONSE' && onContent) {
              onContent(data.content);
            } else if (data.type === 'SQL_QUERY' && onSql) {
              onSql(data.sql);
            } else if (data.type === 'SUGGESTIONS' && onSuggestions) {
              onSuggestions(data.suggestions);
            } else if (data.type === 'DONE' && onDone) {
              onDone();
            }
          } catch (err) {
            console.error('Failed to parse SSE JSON payload:', err, jsonStr);
          }
        }
      }
    }

    if (onDone) onDone();
  } catch (err) {
    console.error('Error in chat stream:', err);
    if (onError) onError(err);
  }
}
