/**
 * Real, category-matched photography from Unsplash (direct CDN hotlink —
 * Unsplash's images.unsplash.com URLs are designed for this, unlike some
 * other stock sites). Each category maps to a manually verified, on-topic
 * photo instead of a random/generic image.
 */
const CATEGORY_PHOTO_IDS: Record<string, string> = {
  'Fitness & Health': '1517836357463-d25dfeac3438', // person about to lift a barbell
  'Music Production': '1509310202330-aec5af561c6b', // photo of black digital audio mixer
  'Personal Finance': '1553729459-efe14ef6055d', // fan of dollar banknotes
  'Art & Design': '1587120511358-98f9104cc096', // person holding pen and iPad
  Comedy: '1580188928585-0ef5c1a5c4dd', // black microphone on red curtain
  'Career Mentorship': '1761933799610-c9a75f115794', // two businessmen talking intently
  Cooking: '1760169799369-2b8574466735', // chefs preparing food in a busy kitchen
  Gaming: '1542751371-adc38448a05e', // person on gaming chair playing video game
  Photography: '1516035069371-29a1b244cc32', // flat lay DSLR camera
  'Business Coaching': '1551135049-8a33b5883817', // four people reviewing papers on a table
};

export function getCoverPhoto(label: string, width = 400, height = 500) {
  const id = CATEGORY_PHOTO_IDS[label];
  if (!id) {
    // fallback: neutral generic image so nothing ever breaks
    return `https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=${width}&h=${height}&fit=crop&auto=format&q=80`;
  }
  return `https://images.unsplash.com/photo-${id}?w=${width}&h=${height}&fit=crop&auto=format&q=80`;
}
