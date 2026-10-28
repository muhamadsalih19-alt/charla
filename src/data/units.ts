export interface Phrase {
  es: string;
  en: string;
}

export interface Unit {
  id: string;
  num: number;
  title: string;
  titleEn: string;
  level: string;
  /** short plain-English explanation, one idea per paragraph */
  explain: string[];
  phrases: Phrase[];
  /** speaking scenario that practises this unit */
  scenario?: string;
}

export const UNITS: Unit[] = [
  {
    id: 'u1',
    num: 1,
    title: 'Hola, ¿qué tal?',
    titleEn: 'Greetings and introductions',
    level: 'A1',
    explain: [
      'Use "hola" any time of day. "Buenos días" is morning, "buenas tardes" afternoon, "buenas noches" evening.',
      '"Ser" describes who someone is: "Soy Ana" (I am Ana), "Soy de Chicago" (I am from Chicago).',
      'Use "tú" with friends and people your age, and "usted" with older people or in formal situations.',
    ],
    phrases: [
      { es: 'Hola, me llamo Sam.', en: 'Hi, my name is Sam.' },
      { es: '¿Cómo te llamas?', en: 'What is your name?' },
      { es: 'Mucho gusto.', en: 'Nice to meet you.' },
      { es: 'Soy de Estados Unidos.', en: 'I am from the United States.' },
      { es: '¿De dónde eres?', en: 'Where are you from?' },
      { es: '¿Cómo estás?', en: 'How are you?' },
      { es: 'Estoy bien, gracias.', en: 'I am fine, thank you.' },
      { es: 'Nos vemos mañana.', en: 'See you tomorrow.' },
    ],
    scenario: 'conocer',
  },
  {
    id: 'u2',
    num: 2,
    title: 'Ser y estar',
    titleEn: 'Two ways to say "to be"',
    level: 'A1',
    explain: [
      '"Ser" is for identity and lasting traits: who you are, where you are from, your job, what something is like.',
      '"Estar" is for location and states that can change: where something is, how you feel right now.',
      'A quick test: if it answers "where?" or "how do you feel?", use estar.',
    ],
    phrases: [
      { es: 'Soy profesor.', en: 'I am a teacher.' },
      { es: 'Estoy cansado.', en: 'I am tired.' },
      { es: 'La casa es grande.', en: 'The house is big.' },
      { es: 'El baño está a la derecha.', en: 'The bathroom is on the right.' },
      { es: 'Mi hermana es muy simpática.', en: 'My sister is very nice.' },
      { es: 'Estamos en el centro.', en: 'We are downtown.' },
      { es: 'La comida está deliciosa.', en: 'The food is delicious (right now).' },
      { es: '¿Dónde está el museo?', en: 'Where is the museum?' },
    ],
    scenario: 'direcciones',
  },
  {
    id: 'u3',
    num: 3,
    title: 'El presente',
    titleEn: 'Present tense, regular verbs',
    level: 'A1',
    explain: [
      'Regular verbs end in -ar, -er or -ir. Drop the ending and add a new one for the person.',
      '-ar (hablar): hablo, hablas, habla, hablamos, hablan.',
      '-er (comer): como, comes, come, comemos, comen. -ir (vivir): vivo, vives, vive, vivimos, viven.',
      'In Latin America "ustedes" is used for "you all", so you never need the vosotros form.',
    ],
    phrases: [
      { es: 'Hablo un poco de español.', en: 'I speak a little Spanish.' },
      { es: 'Trabajo en una oficina.', en: 'I work in an office.' },
      { es: '¿Dónde vives?', en: 'Where do you live?' },
      { es: 'Comemos a las dos.', en: 'We eat at two.' },
      { es: 'Ella escribe muchos correos.', en: 'She writes a lot of emails.' },
      { es: '¿Ustedes toman café?', en: 'Do you all drink coffee?' },
      { es: 'Aprendo español todos los días.', en: 'I learn Spanish every day.' },
    ],
    scenario: 'conocer',
  },
  {
    id: 'u4',
    num: 4,
    title: 'Verbos irregulares',
    titleEn: 'Common irregular verbs',
    level: 'A1+',
    explain: [
      'The most useful verbs are irregular, so learn them as whole words.',
      'tener (to have): tengo, tienes, tiene, tenemos, tienen. ir (to go): voy, vas, va, vamos, van.',
      'hacer (to do/make): hago, haces, hace. querer (to want): quiero, quieres, quiere. poder (can): puedo, puedes, puede.',
      'Many expressions use tener: "tengo hambre" (I am hungry), "tengo 30 años" (I am 30).',
    ],
    phrases: [
      { es: 'Tengo hambre.', en: 'I am hungry.' },
      { es: 'Voy al mercado.', en: 'I am going to the market.' },
      { es: '¿Qué haces hoy?', en: 'What are you doing today?' },
      { es: 'Quiero dos tacos, por favor.', en: 'I want two tacos, please.' },
      { es: '¿Puedo pagar con tarjeta?', en: 'Can I pay by card?' },
      { es: 'Tenemos una reservación.', en: 'We have a reservation.' },
      { es: 'Ella tiene treinta años.', en: 'She is thirty years old.' },
    ],
    scenario: 'taqueria',
  },
  {
    id: 'u5',
    num: 5,
    title: 'Me gusta',
    titleEn: 'Likes with gustar',
    level: 'A1+',
    explain: [
      '"Gustar" works backwards from English: "me gusta el café" literally means "coffee pleases me".',
      'Use "gusta" for one thing or an action, and "gustan" for plural things: "me gustan los tacos".',
      'Change the pronoun for the person: me, te, le, nos, les. "¿Te gusta bailar?"',
    ],
    phrases: [
      { es: 'Me gusta el café.', en: 'I like coffee.' },
      { es: 'Me gustan los tacos.', en: 'I like tacos.' },
      { es: '¿Te gusta bailar?', en: 'Do you like to dance?' },
      { es: 'No me gusta el frío.', en: 'I do not like the cold.' },
      { es: 'A mi mamá le gustan las flores.', en: 'My mom likes flowers.' },
      { es: 'Nos encanta la música.', en: 'We love music.' },
    ],
    scenario: 'conocer',
  },
  {
    id: 'u6',
    num: 6,
    title: 'Voy a…',
    titleEn: 'The near future with ir a',
    level: 'A1+',
    explain: [
      'The easiest way to talk about the future: a form of "ir" + "a" + an infinitive.',
      '"Voy a comer" = I am going to eat. "¿Qué vas a hacer?" = What are you going to do?',
    ],
    phrases: [
      { es: 'Voy a comer más tarde.', en: 'I am going to eat later.' },
      { es: '¿Qué vas a hacer mañana?', en: 'What are you going to do tomorrow?' },
      { es: 'Vamos a viajar a Colombia.', en: 'We are going to travel to Colombia.' },
      { es: 'Va a llover.', en: 'It is going to rain.' },
      { es: 'Voy a tomar un taxi.', en: 'I am going to take a taxi.' },
      { es: 'Van a llegar a las ocho.', en: 'They are going to arrive at eight.' },
    ],
    scenario: 'hotel',
  },
  {
    id: 'u7',
    num: 7,
    title: 'El pretérito',
    titleEn: 'Talking about the past',
    level: 'A2',
    explain: [
      'The preterite is for finished actions: things that happened once, at a specific time.',
      '-ar: hablé, hablaste, habló, hablamos, hablaron. -er/-ir: comí, comiste, comió, comimos, comieron.',
      'Key irregulars: fui (I went / I was), hice (I did), tuve (I had), estuve (I was).',
    ],
    phrases: [
      { es: 'Ayer comí en un restaurante.', en: 'Yesterday I ate at a restaurant.' },
      { es: 'Fui a la playa el sábado.', en: 'I went to the beach on Saturday.' },
      { es: '¿Qué hiciste el fin de semana?', en: 'What did you do on the weekend?' },
      { es: 'Hablé con mi hermano.', en: 'I talked with my brother.' },
      { es: 'Vimos una película.', en: 'We watched a movie.' },
      { es: 'Llegaron muy tarde.', en: 'They arrived very late.' },
    ],
    scenario: 'fin-de-semana',
  },
  {
    id: 'u8',
    num: 8,
    title: 'El imperfecto',
    titleEn: 'Imperfect vs. preterite',
    level: 'A2',
    explain: [
      'The imperfect describes the background: how things used to be, ongoing actions, time, age and feelings in the past.',
      '-ar: hablaba, hablabas, hablaba. -er/-ir: comía, comías, comía. Irregular: era, iba, veía.',
      'Preterite = what happened. Imperfect = what was going on. "Llovía cuando llegué" (it was raining when I arrived).',
    ],
    phrases: [
      { es: 'Cuando era niño, vivía en Texas.', en: 'When I was a kid, I lived in Texas.' },
      { es: 'Llovía cuando llegué.', en: 'It was raining when I arrived.' },
      { es: 'Siempre íbamos a la playa.', en: 'We always used to go to the beach.' },
      { es: 'Eran las tres de la tarde.', en: 'It was three in the afternoon.' },
      { es: 'Estaba cansado, así que dormí.', en: 'I was tired, so I slept.' },
    ],
    scenario: 'fin-de-semana',
  },
  {
    id: 'u9',
    num: 9,
    title: 'Lo, la, le',
    titleEn: 'Object pronouns',
    level: 'A2+',
    explain: [
      'Replace a thing with lo (masculine) or la (feminine): "¿El libro? Lo tengo."',
      'Use le for "to him/her/you (usted)": "Le doy el dinero". Me, te and nos work for both.',
      'The pronoun goes before the conjugated verb, or attached to an infinitive: "lo quiero comprar" = "quiero comprarlo".',
    ],
    phrases: [
      { es: '¿La cuenta? Ahorita se la traigo.', en: 'The bill? I will bring it to you right away.' },
      { es: 'Lo quiero comprar.', en: 'I want to buy it.' },
      { es: '¿Me ayudas, por favor?', en: 'Can you help me, please?' },
      { es: 'Te llamo mañana.', en: 'I will call you tomorrow.' },
      { es: 'Le doy el dinero.', en: 'I give him the money.' },
    ],
    scenario: 'mercado',
  },
  {
    id: 'u10',
    num: 10,
    title: 'Mandatos y deseos',
    titleEn: 'Commands and polite requests',
    level: 'B1',
    explain: [
      'Polite commands with usted use the "opposite" vowel: hablar → hable, comer → coma, ir → vaya.',
      'Friendly tú commands often match the él form: habla, come, toma.',
      'After "quiero que" or "ojalá", Spanish uses the subjunctive: "Quiero que vengas" (I want you to come).',
    ],
    phrases: [
      { es: 'Siga derecho dos cuadras.', en: 'Go straight for two blocks.' },
      { es: 'Tome esta pastilla cada ocho horas.', en: 'Take this pill every eight hours.' },
      { es: 'Pásale, estás en tu casa.', en: 'Come in, make yourself at home.' },
      { es: 'Quiero que vengas a la fiesta.', en: 'I want you to come to the party.' },
      { es: 'Ojalá que no llueva.', en: 'I hope it does not rain.' },
    ],
    scenario: 'doctor',
  },
];
