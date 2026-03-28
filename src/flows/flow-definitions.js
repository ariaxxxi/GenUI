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
