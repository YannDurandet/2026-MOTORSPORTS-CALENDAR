/**
 * Serialise data for a `<script type="application/json">` block.
 *
 * Every `<` is written as the JSON escape `<` (JSON.parse turns it back
 * into `<`), so no string in the data, e.g. a `</script>` inside an event's
 * time HTML, can close the block early.
 *
 * Use it for every inline JSON block fed from data: `set:html={jsonForScript(x)}`.
 */
export const jsonForScript = (data: unknown): string =>
  JSON.stringify(data).replace(/</g, '\\u003c');
