export interface Scenario {
  id: string;
  title: string;
  titleEn: string;
  emoji: string;
  /** who the tutor plays */
  role: string;
  setting: string;
  goal: string;
  goalEn: string;
  opener: string;
  openerEn: string;
  minLevel: string;
}

export const SCENARIOS: Scenario[] = [
  {
    id: 'taqueria',
    title: 'En la taquería',
    titleEn: 'At the taco stand',
    emoji: '🌮',
    role: 'Don Beto, a friendly taquero who runs a busy taco stand in Mexico City',
    setting: 'A taco stand in Colonia Roma, Mexico City, on a Friday night.',
    goal: 'Pide dos tacos y una bebida, y luego pide la cuenta.',
    goalEn: 'Order two tacos and a drink, then ask for the bill.',
    opener: '¡Buenas noches! Bienvenido a Tacos Don Beto. ¿Qué le sirvo?',
    openerEn: 'Good evening! Welcome to Tacos Don Beto. What can I get you?',
    minLevel: 'A1',
  },
  {
    id: 'conocer',
    title: 'Conocer a alguien',
    titleEn: 'Meeting someone new',
    emoji: '👋',
    role: 'Valeria, a friendly 28-year-old graphic designer from Guadalajara, at a friend’s party',
    setting: 'A small party at a friend’s apartment in Guadalajara.',
    goal: 'Preséntate y aprende tres cosas sobre Valeria.',
    goalEn: 'Introduce yourself and learn three things about Valeria.',
    opener: '¡Hola! Creo que no nos conocemos. Soy Valeria. ¿Cómo te llamas?',
    openerEn: 'Hi! I don’t think we’ve met. I’m Valeria. What’s your name?',
    minLevel: 'A1',
  },
  {
    id: 'mercado',
    title: 'En el mercado',
    titleEn: 'At the market',
    emoji: '🥑',
    role: 'Doña Lupita, a cheerful fruit and vegetable seller at a market in Oaxaca',
    setting: 'A busy fruit stall at the Mercado Benito Juárez in Oaxaca.',
    goal: 'Compra aguacates y otra fruta. Pregunta los precios.',
    goalEn: 'Buy avocados and one other fruit. Ask about prices.',
    opener: '¡Pásele, pásele! ¿Qué va a llevar hoy? Tenemos aguacates muy buenos.',
    openerEn: 'Come on in! What will you take today? We have very good avocados.',
    minLevel: 'A1',
  },
  {
    id: 'direcciones',
    title: 'Pedir direcciones',
    titleEn: 'Asking for directions',
    emoji: '🗺️',
    role: 'Andrés, a helpful local in Bogotá waiting at a bus stop',
    setting: 'A street corner in La Candelaria, Bogotá.',
    goal: 'Pregunta cómo llegar al Museo del Oro y cuánto tiempo se tarda.',
    goalEn: 'Ask how to get to the Gold Museum and how long it takes.',
    opener: 'Buenas. ¿Le puedo ayudar en algo? Parece un poco perdido.',
    openerEn: 'Hello. Can I help you with something? You look a little lost.',
    minLevel: 'A1+',
  },
  {
    id: 'hotel',
    title: 'En el hotel',
    titleEn: 'Checking into a hotel',
    emoji: '🏨',
    role: 'Camila, a receptionist at a small hotel in Cartagena',
    setting: 'The front desk of a boutique hotel in Cartagena, Colombia.',
    goal: 'Haz el check-in, pregunta a qué hora es el desayuno y pide la contraseña del wifi.',
    goalEn: 'Check in, ask what time breakfast is, and ask for the wifi password.',
    opener: '¡Bienvenido al Hotel Las Palmas! ¿Tiene una reservación?',
    openerEn: 'Welcome to Hotel Las Palmas! Do you have a reservation?',
    minLevel: 'A1+',
  },
  {
    id: 'doctor',
    title: 'En el doctor',
    titleEn: 'At the doctor',
    emoji: '🩺',
    role: 'Dra. Morales, a calm and kind family doctor in Lima',
    setting: 'A doctor’s office in Miraflores, Lima.',
    goal: 'Explica cómo te sientes y desde cuándo. Entiende qué tienes que hacer.',
    goalEn: 'Explain how you feel and since when. Understand what you need to do.',
    opener: 'Buenos días, pase y siéntese. Dígame, ¿qué le pasa?',
    openerEn: 'Good morning, come in and sit down. Tell me, what’s wrong?',
    minLevel: 'A2',
  },
  {
    id: 'fin-de-semana',
    title: 'Tu fin de semana',
    titleEn: 'Your weekend',
    emoji: '☀️',
    role: 'Sofi, your tutor, chatting casually like a friend',
    setting: 'A casual video chat on Monday morning.',
    goal: 'Cuenta qué hiciste el fin de semana (en pasado).',
    goalEn: 'Tell what you did on the weekend (in the past tense).',
    opener: '¡Hola! ¿Qué tal tu fin de semana? ¿Qué hiciste?',
    openerEn: 'Hi! How was your weekend? What did you do?',
    minLevel: 'A2',
  },
];

export const FREE_CHAT: Scenario = {
  id: 'charla-libre',
  title: 'Charla libre',
  titleEn: 'Free chat',
  emoji: '💬',
  role: 'Sofi, your friendly tutor from Mexico City',
  setting: 'A relaxed conversation about anything the learner wants.',
  goal: 'Habla de lo que quieras.',
  goalEn: 'Talk about anything you like.',
  opener: '¡Hola! ¿Cómo estás hoy? ¿De qué quieres hablar?',
  openerEn: 'Hi! How are you today? What do you want to talk about?',
  minLevel: 'A1',
};

export const TUTOR_MODE: Scenario = {
  id: 'pregunta',
  title: 'Pregúntale a Sofi',
  titleEn: 'Ask Sofi',
  emoji: '❓',
  role: 'Sofi, a patient Spanish teacher who answers questions about Spanish',
  setting: 'A one-on-one lesson where the learner asks questions like “how do I say…?” or “why is it estoy and not soy?”.',
  goal: 'Haz preguntas sobre el español.',
  goalEn: 'Ask anything about Spanish.',
  opener: '¡Hola! Pregúntame lo que quieras sobre el español. Puedes preguntar en inglés.',
  openerEn: 'Hi! Ask me anything about Spanish. You can ask in English.',
  minLevel: 'A1',
};

export const PLACEMENT: Scenario = {
  id: 'placement',
  title: 'Conozcámonos',
  titleEn: 'Let’s get to know you',
  emoji: '🎯',
  role: 'Sofi, a warm tutor from Mexico City running a short, friendly placement chat',
  setting: 'The learner’s first conversation in the app.',
  goal: 'Una conversación corta para conocer tu nivel.',
  goalEn: 'A short chat so Sofi can find your level.',
  opener: '¡Hola! Soy Sofi, tu tutora de español. ¿Cómo te llamas?',
  openerEn: 'Hi! I’m Sofi, your Spanish tutor. What’s your name?',
  minLevel: 'A1',
};
