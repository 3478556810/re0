// Package retrieval provides document chunking and hybrid search logic.
package retrieval

import (
	"strings"
	"unicode/utf8"
)

// ChunkConfig configures the chunking strategy.
type ChunkConfig struct {
	MaxTokens     int // max tokens per chunk, default 512
	OverlapTokens int // overlap tokens between chunks, default 64
}

// DefaultChunkConfig returns the default chunk configuration.
func DefaultChunkConfig() ChunkConfig {
	return ChunkConfig{
		MaxTokens:     512,
		OverlapTokens: 64,
	}
}

// Chunk represents a single document chunk.
type Chunk struct {
	Index   int
	Content string
}

// estimateTokenCount provides a rough estimate of token count.
// Uses ratio of ~1 token per 4 characters for English, ~1.5 for mixed CJK.
func estimateTokenCount(text string) int {
	cjkCount := 0
	asciiCount := 0
	for _, r := range text {
		if r > 0x4E00 && r < 0x9FFF { // CJK Unified Ideographs
			cjkCount++
		} else if r <= 0x7F {
			asciiCount++
		}
	}
	return cjkCount + asciiCount/4
}

// ChunkDocument splits document content into semantic chunks.
// Strategy: split by paragraphs first, then merge paragraphs into chunks
// that fit within MaxTokens, with configurable overlap.
func ChunkDocument(content string, cfg ChunkConfig) []Chunk {
	if cfg.MaxTokens <= 0 {
		cfg.MaxTokens = 512
	}
	if cfg.OverlapTokens <= 0 {
		cfg.OverlapTokens = 64
	}

	// Split into paragraphs (by double newline first, then single newline)
	paragraphs := splitParagraphs(content)
	if len(paragraphs) == 0 {
		return []Chunk{{Index: 0, Content: content}}
	}

	var chunks []Chunk
	var currentBuilder strings.Builder
	currentTokens := 0
	chunkIndex := 0

	flushChunk := func() {
		if currentBuilder.Len() > 0 {
			chunks = append(chunks, Chunk{
				Index:   chunkIndex,
				Content: strings.TrimSpace(currentBuilder.String()),
			})
			chunkIndex++
			currentBuilder.Reset()
			currentTokens = 0
		}
	}

	for _, para := range paragraphs {
		paraTokens := estimateTokenCount(para)

		// If the paragraph alone exceeds max tokens, split it further
		if paraTokens > cfg.MaxTokens {
			// Flush current buffer first
			flushChunk()

			// Split long paragraph by sentences or by character count
			subChunks := splitLongParagraph(para, cfg.MaxTokens)
			for _, sc := range subChunks {
				chunks = append(chunks, Chunk{
					Index:   chunkIndex,
					Content: strings.TrimSpace(sc),
				})
				chunkIndex++
			}
			continue
		}

		// If adding this paragraph would exceed max tokens, flush first
		if currentTokens+paraTokens > cfg.MaxTokens && currentBuilder.Len() > 0 {
			flushChunk()
		}

		// Add paragraph to current chunk
		if currentBuilder.Len() > 0 {
			currentBuilder.WriteString("\n\n")
		}
		currentBuilder.WriteString(para)
		currentTokens += paraTokens
	}

	// Flush remaining
	flushChunk()

	// Apply overlap: create additional chunks from the tail of each chunk
	if cfg.OverlapTokens > 0 && len(chunks) > 1 {
		chunks = applyOverlap(chunks, cfg.OverlapTokens)
	}

	return chunks
}

// splitParagraphs splits content into paragraphs.
func splitParagraphs(content string) []string {
	// Try double newline first
	paras := strings.Split(content, "\n\n")
	var result []string
	for _, p := range paras {
		p = strings.TrimSpace(p)
		if p == "" {
			continue
		}
		// If a paragraph still contains single newlines, split those too
		subLines := strings.Split(p, "\n")
		for _, line := range subLines {
			line = strings.TrimSpace(line)
			if line != "" {
				result = append(result, line)
			}
		}
	}
	return result
}

// splitLongParagraph splits a paragraph that exceeds max tokens into smaller pieces.
func splitLongParagraph(text string, maxTokens int) []string {
	// Split by sentences (periods, exclamation marks, question marks)
	sentences := splitSentences(text)
	var chunks []string
	var current strings.Builder
	currentTokens := 0

	for _, s := range sentences {
		sTokens := estimateTokenCount(s)
		if currentTokens+sTokens > maxTokens && current.Len() > 0 {
			chunks = append(chunks, strings.TrimSpace(current.String()))
			current.Reset()
			currentTokens = 0
		}
		if current.Len() > 0 {
			current.WriteString(" ")
		}
		current.WriteString(s)
		currentTokens += sTokens
	}

	if current.Len() > 0 {
		chunks = append(chunks, strings.TrimSpace(current.String()))
	}

	return chunks
}

// splitSentences splits text into sentences.
func splitSentences(text string) []string {
	var sentences []string
	var current strings.Builder
	for _, r := range text {
		current.WriteRune(r)
		if r == '.' || r == '!' || r == '?' || r == '。' || r == '！' || r == '？' || r == '\n' {
			s := strings.TrimSpace(current.String())
			if s != "" {
				sentences = append(sentences, s)
			}
			current.Reset()
		}
	}
	remaining := strings.TrimSpace(current.String())
	if remaining != "" {
		sentences = append(sentences, remaining)
	}
	return sentences
}

// applyOverlap creates overlapping chunks by appending the tail of the previous chunk
// to the beginning of the next chunk.
func applyOverlap(chunks []Chunk, overlapTokens int) []Chunk {
	if len(chunks) <= 1 {
		return chunks
	}

	result := make([]Chunk, len(chunks))
	copy(result, chunks)

	for i := 1; i < len(chunks); i++ {
		prevContent := chunks[i-1].Content
		// Calculate overlap content from previous chunk
		overlapContent := getTail(prevContent, overlapTokens)
		if overlapContent != "" {
			result[i].Content = overlapContent + "\n\n" + result[i].Content
		}
	}

	return result
}

// getTail returns the last N tokens of text.
func getTail(text string, nTokens int) string {
	runes := []rune(text)
	if len(runes) == 0 {
		return ""
	}

	// Approximate: 1 token ~ 4 chars for ASCII, 1 char for CJK
	charCount := 0
	tailStart := len(runes)
	for i := len(runes) - 1; i >= 0; i-- {
		r := runes[i]
		if r > 0x4E00 && r < 0x9FFF {
			charCount++
		} else {
			charCount++
			if r <= 0x7F {
				charCount += 3 // ascii needs ~4 chars per token, we've counted 1
			}
		}
		if charCount >= nTokens*4 {
			tailStart = i
			break
		}
	}

	if tailStart >= len(runes) {
		return text
	}

	// Ensure we don't start in the middle of a word - find next space or newline
	for tailStart < len(runes) && tailStart > 0 {
		r := runes[tailStart]
		if r == ' ' || r == '\n' || r == '.' || r == '。' {
			tailStart++
			break
		}
		tailStart++
	}

	if tailStart >= len(runes) {
		return ""
	}

	return string(runes[tailStart:])
}

// Ensure utf8 is used (import reference)
var _ = utf8.ValidString
