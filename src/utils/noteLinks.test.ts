import { describe, expect, it } from 'vitest';
import { buildNoteLink, isNoteLink, parseNoteLink } from './noteLinks';

describe('noteLinks', () => {
  it('builds and parses internal note links', () => {
    const href = buildNoteLink('abc-123');
    expect(href).toBe('notes-note://abc-123');
    expect(isNoteLink(href)).toBe(true);
    expect(parseNoteLink(href)).toBe('abc-123');
  });

  it('returns null for invalid links', () => {
    expect(parseNoteLink('https://example.com')).toBeNull();
    expect(parseNoteLink('notes-note://')).toBeNull();
    expect(isNoteLink('https://example.com')).toBe(false);
  });
});
