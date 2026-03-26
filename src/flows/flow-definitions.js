export const SEND_MESSAGE_FLOW_DEFINITION = {
  id: "send_message",
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
      actions: ["send", "edit", "cancel"],
    },
  ],
  execution: {
    loading: { layout: ["compact_status"], props: { compact_status: { type: "loading", label: "·", dotsId: "g-thinking-dots" } } },
    success: { layout: ["compact_status"], props: { compact_status: { type: "success", label: "Message sent" } } },
  },
};

export const BOOK_FLIGHT_FLOW_DEFINITION = {
  id: "book_flight",
  slots: [
    { id: "destination", type: "text_input", required: true, voice: "Where would you like to go?", ui: ["flight_route_step"], voiceMode: "command" },
    { id: "dates", type: "text_input", required: true, voice: "When are you departing and returning?", ui: ["flight_route_step"], voiceMode: "command" },
    { id: "passengers", type: "entity_select", required: true, voice: "How many passengers?", ui: ["selection_list"] },
    { id: "flight_option", type: "entity_select", required: true, voice: "Which flight do you want?", ui: ["selection_list"] },
    { id: "confirm", type: "action_select", required: true, voice: "Would you like to confirm this flight?", ui: ["info_card"], actions: ["confirm", "change", "cancel"] },
    { id: "payment", type: "entity_select", required: true, voice: "How would you like to pay?", ui: ["selection_list"] },
  ],
  execution: {
    loading: { layout: ["compact_status"], props: { compact_status: { type: "loading", label: "Searching flights...", dotsId: "g-thinking-dots" } } },
    success: { layout: ["compact_status"], props: { compact_status: { type: "success", label: "Trip booked" } } },
  },
};

export const ORDER_COFFEE_FLOW_DEFINITION = {
  id: "order_coffee",
  slots: [
    { id: "drink", type: "chip_select", required: true, voice: "What drink would you like?", ui: ["chip_bar"] },
    { id: "size", type: "chip_select", required: true, voice: "What size?", ui: ["chip_bar"] },
    { id: "confirm", type: "action_select", required: true, voice: "Ready to order?", ui: ["info_card"], actions: ["order", "change", "cancel"] },
  ],
  execution: {
    loading: { layout: ["compact_status"], props: { compact_status: { type: "loading", label: "Preparing order...", dotsId: "g-thinking-dots" } } },
    success: { layout: ["compact_status"], props: { compact_status: { type: "success", label: "Coffee ordered" } } },
  },
};
