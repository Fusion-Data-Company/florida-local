# Social Media Sharing - Florida Local

## Overview
The Florida Local platform is configured with comprehensive Open Graph and Twitter Card meta tags to ensure the brand logo appears when links are shared on social media platforms.

## Supported Platforms
✅ **Facebook** - Shows logo image in link previews  
✅ **Twitter/X** - Shows logo with large image card  
✅ **LinkedIn** - Shows logo in professional shares  
✅ **WhatsApp** - Shows logo in message previews  
✅ **Apple Messages/iMessage** - Shows logo with link  
✅ **Slack** - Shows logo in unfurled links  
✅ **Discord** - Shows logo in embed previews  
✅ **Telegram** - Shows logo in link previews  

## Implementation Details

### Meta Tags Location
`client/index.html` - Lines 12-36

### Brand Image
- **File**: `attached_assets/florida-local-og-image.png`
- **Dimensions**: 1200x1200px (optimal for all platforms)
- **Format**: PNG with transparency
- **Size**: 1.2MB
- **URL**: `https://[domain]/attached_assets/florida-local-og-image.png`

### Meta Tags Included

#### Open Graph (Facebook, LinkedIn, WhatsApp)
```html
<meta property="og:type" content="website" />
<meta property="og:url" content="[domain]" />
<meta property="og:title" content="The Florida Local" />
<meta property="og:description" content="Discover and support Florida's most vibrant local businesses." />
<meta property="og:image" content="[domain]/attached_assets/florida-local-og-image.png" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="1200" />
<meta property="og:image:type" content="image/png" />
<meta property="og:image:alt" content="The Florida Local - Premium Business Networking Platform" />
<meta property="og:site_name" content="The Florida Local" />
```

#### Twitter Cards
```html
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:url" content="[domain]" />
<meta name="twitter:title" content="The Florida Local" />
<meta name="twitter:description" content="Discover and support Florida's most vibrant local businesses." />
<meta name="twitter:image" content="[domain]/attached_assets/florida-local-og-image.png" />
```

## Testing Your Implementation

### Facebook Sharing Debugger
1. Visit: https://developers.facebook.com/tools/debug/
2. Enter your URL
3. Click "Scrape Again" to refresh cache
4. Verify logo appears in preview

### Twitter Card Validator  
1. Visit: https://cards-dev.twitter.com/validator
2. Enter your URL
3. Verify logo shows in large image card

### LinkedIn Post Inspector
1. Visit: https://www.linkedin.com/post-inspector/
2. Enter your URL
3. Verify logo appears in preview

### General Testing
Simply paste your URL into any supported platform and verify the Florida Local logo appears!

## Production Deployment Notes

### ⚠️ Important: Update Domain URLs
When deploying to production with a custom domain:

1. **Update meta tag URLs** in `client/index.html`
2. Replace all instances of the development domain with your production domain
3. Ensure the image path remains: `/attached_assets/florida-local-og-image.png`

### Image Hosting
- Image is self-hosted on your domain (no external CDN required)
- Path: `attached_assets/florida-local-og-image.png`
- This ensures complete control and no external dependencies

## Troubleshooting

### Logo Not Showing?
1. **Clear social media cache** - Use platform debugging tools above
2. **Verify image accessibility** - Check that `https://yourdomain.com/attached_assets/florida-local-og-image.png` returns HTTP 200
3. **Check meta tags** - View page source and verify all OG/Twitter tags are present

### Cache Issues
Social media platforms cache meta tags. To force refresh:
- **Facebook**: Use Sharing Debugger and click "Scrape Again"
- **Twitter**: Use Card Validator
- **LinkedIn**: Use Post Inspector
- Wait 24-48 hours for automatic cache expiration

## Best Practices

✅ **Image is optimized** (1200x1200px PNG)  
✅ **No external dependencies** (self-hosted)  
✅ **Comprehensive meta tags** (all major platforms covered)  
✅ **Descriptive alt text** (accessibility compliant)  
✅ **Proper image dimensions** (optimal display on all devices)  

---

**Last Updated**: October 11, 2025  
**Status**: ✅ Fully Implemented and Tested
