export const SEND_MESSAGE_FLOW_DEFINITION = {
  id: "send_message",
  confirmTemplate: {
    title: "To: {recipient}",
    subtitle: "{message_body}",
  },
  slots: [
    {
      id: "recipient",
      type: "entity_select",
      required: true,
      voice: "Which Hiro?",
      ui: ["selection_list"],
    },
    {
      id: "message_body",
      type: "text_input",
      required: true,
      voice: "What would you like to say?",
      ui: ["contact_header", "chip_bar", "input_field"],
    },
    {
      id: "confirm",
      type: "action_select",
      required: true,
      voice: "Ready to send?",
      ui: ["contact_header", "text_bubble"],
      actions: ["send", "cancel"],
      editPhrases: ["change the message", "edit message", "rewrite it", "change recipient"],
    },
  ],
  execution: {
    loading: { layout: ["compact_status"], props: { compact_status: { type: "loading", label: "·", dotsId: "g-thinking-dots" } } },
    success: { layout: ["compact_status"], props: { compact_status: { type: "success", label: "Message sent" } } },
  },
};

export const BOOK_FLIGHT_FLOW_DEFINITION = {
  id: "book_flight",
  confirmTemplate: {
    title: "{origin} → {destination_code}",
    subtitle: "{dates_label} · {price}",
    detail: "{payment_method}",
  },
  slots: [
    { id: "destination", type: "text_input", required: true, voice: "Where would you like to go?", ui: ["flight_route_step"], voiceMode: "command" },
    { id: "dates", type: "text_input", required: true, voice: "When are you departing and returning?", ui: ["flight_route_step"], voiceMode: "command" },
    { id: "passengers", type: "entity_select", required: true, voice: "How many passengers?", ui: ["selection_list"] },
    {
      id: "flight_option",
      type: "recommendation",
      required: true,
      voice: "I found a recommended flight.",
      ui: ["info_card"],
      levels: {
        recommend: { layout: ["info_card"], actions: ["confirm", "alternatives", "cancel"] },
        alternatives: { layout: ["selection_list"], maxItems: 2, diversityStrategy: "tradeoff" },
        refine: {},
      },
      editPhrases: ["change the flight", "different flight", "another flight"],
    },
    { id: "payment_method", type: "entity_select", required: true, autoDefault: true, defaultSource: "user.primaryPaymentMethod", voice: "How would you like to pay?", ui: ["selection_list"], editPhrases: ["use my visa", "use apple pay", "different card", "payment"] },
    { id: "confirm", type: "action_select", required: true, voice: "Would you like to confirm this flight?", ui: ["info_card"], actions: ["confirm", "cancel"], editPhrases: ["change the date", "use my visa", "different card", "show details", "flight times"] },
  ],
  execution: {
    loading: { layout: ["compact_status"], props: { compact_status: { type: "loading", label: "Searching flights...", dotsId: "g-thinking-dots" } } },
    success: { layout: ["compact_status"], props: { compact_status: { type: "success", label: "Trip booked" } } },
  },
};

export const ORDER_COFFEE_FLOW_DEFINITION = {
  id: "order_coffee",
  confirmTemplate: {
    title: "{size} {drink}",
    subtitle: "{price}",
    detail: "{payment_method}",
  },
  slots: [
    { id: "drink", type: "chip_select", required: true, voice: "What drink would you like?", ui: ["chip_bar"] },
    { id: "size", type: "chip_select", required: true, voice: "What size?", ui: ["chip_bar"] },
    { id: "payment_method", type: "entity_select", required: true, autoDefault: true, defaultSource: "user.primaryPaymentMethod", voice: "Using your default card.", ui: ["selection_list"], editPhrases: ["different card", "use visa", "payment"] },
    { id: "confirm", type: "action_select", required: true, voice: "Ready to order?", ui: ["info_card"], actions: ["order", "cancel"], editPhrases: ["make it large", "change drink", "different card", "change size"] },
  ],
  execution: {
    loading: { layout: ["compact_status"], props: { compact_status: { type: "loading", label: "Preparing order...", dotsId: "g-thinking-dots" } } },
    success: { layout: ["compact_status"], props: { compact_status: { type: "success", label: "Coffee ordered" } } },
  },
};
