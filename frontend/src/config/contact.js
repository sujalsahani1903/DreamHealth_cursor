/** Business contact — used on Contact page and WhatsApp links */
export const BUSINESS = {
  address: "Eastern By Pass, Bangla Bazar, Beside Bhaktinagar P.S., Siliguri-734001",
  phones: ["+91 7719180111", "9907278300"],
  whatsapp: "917719180111",
  email: "admin@dreamhealthfoods.com",
};

export function whatsappUrl(text) {
  const msg = encodeURIComponent(text);
  return `https://wa.me/${BUSINESS.whatsapp}?text=${msg}`;
}

export const WHATSAPP_MESSAGES = {
  order: "Hello Dream Health Foods! I would like to place an order. Please share available products and prices.",
  enquiry: "Hello Dream Health Foods! I have a question / enquiry.",
};
