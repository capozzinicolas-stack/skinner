/**
 * Skinner Conversion Pixel
 *
 * B2B installs this script on their checkout confirmation page.
 * It reads the skr_ref parameter from the product URL and reports
 * the conversion back to Skinner.
 *
 * Installation (< 10 lines):
 * <script>
 *   (function(){
 *     var r = new URLSearchParams(document.referrer.split('?')[1] || window.location.search).get('skr_ref');
 *     if(!r) return;
 *     var v = document.querySelector('[data-skinner-value]');
 *     var amt = v ? v.getAttribute('data-skinner-value') : '0';
 *     navigator.sendBeacon('/api/pixel', JSON.stringify({ref:r,value:parseFloat(amt)}));
 *   })();
 * </script>
 */

export const PIXEL_SCRIPT = `<script>
(function(){
  var p = new URLSearchParams(window.location.search);
  var r = p.get('skr_ref');
  if(!r) return;
  var v = document.querySelector('[data-skinner-value]');
  var amt = v ? v.getAttribute('data-skinner-value') : '0';
  fetch('SKINNER_URL/api/pixel', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({ref: r, value: parseFloat(amt)})
  });
})();
</script>`;

export function generatePixelScript(baseUrl: string): string {
  return PIXEL_SCRIPT.replace("SKINNER_URL", baseUrl);
}
