export const storeContact = {
  address: "Eastern By Pass, Bangla Bazar, Beside Bhaktinagar P.S., Siliguri-734001",
  phones: ["+91 7719180111", "9907278300"],
  whatsapp: "917719180111",
  email: "admin@dreamhealthfoods.com",
};

export function waLink(text) {
  return `https://wa.me/${storeContact.whatsapp}?text=${encodeURIComponent(text)}`;
}

export const waPrefill = {
  order: "Hi, I'd like to place an order. What packs do you have available?",
  enquiry: "Hi, I have a question about your products.",
};
