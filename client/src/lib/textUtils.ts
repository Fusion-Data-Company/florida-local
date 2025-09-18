// Utility functions for parsing mentions and hashtags

export interface ParsedContent {
  text: string;
  mentions: string[];
  hashtags: string[];
}

export function parseContent(content: string): ParsedContent {
  const mentions: string[] = [];
  const hashtags: string[] = [];

  // Extract mentions (@username)
  const mentionRegex = /@([a-zA-Z0-9_]+)/g;
  let mentionMatch;
  while ((mentionMatch = mentionRegex.exec(content)) !== null) {
    mentions.push(mentionMatch[1]);
  }

  // Extract hashtags (#tag)
  const hashtagRegex = /#([a-zA-Z0-9_]+)/g;
  let hashtagMatch;
  while ((hashtagMatch = hashtagRegex.exec(content)) !== null) {
    hashtags.push(hashtagMatch[1]);
  }

  return {
    text: content,
    mentions: [...new Set(mentions)], // Remove duplicates
    hashtags: [...new Set(hashtags)], // Remove duplicates
  };
}

export function highlightContent(content: string): string {
  // Highlight mentions in blue
  content = content.replace(
    /@([a-zA-Z0-9_]+)/g,
    '<span class="text-blue-600 font-medium">@$1</span>'
  );

  // Highlight hashtags in primary color
  content = content.replace(
    /#([a-zA-Z0-9_]+)/g,
    '<span class="text-primary font-medium">#$1</span>'
  );

  return content;
}

export function extractTrendingHashtags(posts: Array<{ content: string }>): Array<{ tag: string; count: number }> {
  const hashtagCounts = new Map<string, number>();

  posts.forEach(post => {
    const parsed = parseContent(post.content);
    parsed.hashtags.forEach(tag => {
      hashtagCounts.set(tag, (hashtagCounts.get(tag) || 0) + 1);
    });
  });

  return Array.from(hashtagCounts.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10); // Top 10 trending hashtags
}
