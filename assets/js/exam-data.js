/* =========================================================================
   CONTENIDO DE LA PRUEBA Y CLAVES DE RESPUESTA
   Transcrito de Listening_1.docx, Listening_2.docx y Listening_3.docx.

   Tipos de pregunta:
     mc        selección múltiple (una respuesta)
     group     varias preguntas de selección múltiple bajo un mismo enunciado
     match     emparejamiento: cada fila recibe una letra del banco
               (key "" = fila distractora, no puntúa)
     sequence  ordenar etapas con letras
     gap       completar espacios ("___" marca el espacio);
               accept = respuestas aceptadas (sin distinguir mayúsculas)
   ========================================================================= */
window.EXAM = [
  /* ---------------------------------------------------------------- L1 */
  {
    id: "L1",
    label: "Listening 1",
    kicker: "A Student Discussion",
    title: "Earth and Mars",
    intro: "You will hear two students discussing similarities and differences between Earth and Mars. Listen carefully and complete the tasks below. You may hear the recording twice.",
    audio: "audio/listening-1.mp3",
    parts: [
      {
        title: "Part A. Multiple choice",
        instructions: "Choose the best answer (a, b, c, or d).",
        questions: [
          {
            id: "L1-Q1", num: "1", type: "mc", points: 1, key: "b",
            prompt: "What is the main focus of the students' discussion?",
            options: [
              ["a", "Exploring whether humans could survive on Mars in the future."],
              ["b", "Comparing different characteristics of Earth and Mars."],
              ["c", "Explaining why Earth is more suitable for life than Mars."],
              ["d", "Identifying the main challenges of travelling to Mars."]
            ]
          },
          {
            id: "L1-Q2", num: "2", type: "mc", points: 1, key: "c",
            prompt: "Why does Student 1 mention Jupiter during the conversation?",
            options: [
              ["a", "To explain why Mars is considered relatively close to Earth."],
              ["b", "To show that Jupiter and Mars have similar distances from the Sun."],
              ["c", "To put the distance between Earth and Mars into perspective."],
              ["d", "To suggest that astronomical units are more accurate than kilometers."]
            ]
          },
          {
            id: "L1-Q3", num: "3", type: "mc", points: 1, key: "a",
            prompt: "Which sequence best reflects the order in which the students discuss these topics?",
            options: [
              ["a", "Temperature → Distance from the Sun → Length of a day → Water."],
              ["b", "Distance from the Sun → Temperature → Water → Length of a day."],
              ["c", "Temperature → Length of a day → Distance from the Sun → Water."],
              ["d", "Distance from the Sun → Water → Temperature → Length of a day."]
            ]
          }
        ]
      },
      {
        title: "Part B. Matching",
        questions: [
          {
            id: "L1-Q4", num: "4", type: "match", points: 1, unique: true,
            prompt: "Match each topic (a-d) with the information discussed in the recording. There are TWO extra options that you do not need to use.",
            bankTitle: "Topics",
            bank: [
              ["a", "Length of day"],
              ["b", "Water"],
              ["c", "Atmosphere"],
              ["d", "Gravity"]
            ],
            rowsTitle: "Information",
            rows: [
              { text: "It is stronger than on the Moon but weaker than on Earth.", key: "d" },
              { text: "It is almost the same on both planets.", key: "a" },
              { text: "It contains mainly nitrogen and oxygen on both planets.", key: "" },
              { text: "It may have been more abundant in the past.", key: "b" },
              { text: "It is much thinner and consists mainly of carbon dioxide.", key: "c" },
              { text: "It is responsible for the difference in the planets' colors.", key: "" }
            ]
          }
        ]
      },
      {
        title: "Part C. Gap filling",
        questions: [
          {
            id: "L1-Q5", num: "5", type: "gap", points: 0.75,
            prompt: "Complete the sentences using information from the recording. Write NO MORE THAN TWO WORDS OR A NUMBER in each gap.",
            blanks: [
              { letter: "a", text: "Mars is approximately ___ million kilometers from the Sun.", accept: ["228"] },
              { letter: "b", text: "Mars is approximately ___ the size of Earth.", accept: ["half"] },
              { letter: "c", text: "The average temperature on Mars is approximately ___ degrees Celsius.", accept: ["minus 55", "-55", "minus fifty-five", "minus fifty five"] },
              { letter: "d", text: "Most of the water currently found on Mars is probably ___.", accept: ["frozen"] }
            ]
          }
        ]
      }
    ]
  },

  /* ---------------------------------------------------------------- L2 */
  {
    id: "L2",
    label: "Listening 2",
    kicker: "A Radio Program",
    title: "Work Life Balance",
    intro: "Listen carefully to the following clip of a radio program where the host and the guest discuss work-life balance issues. You can hear the recording twice.",
    audio: "audio/listening-2.mp3",
    parts: [
      {
        title: "Global Comprehension",
        questions: [
          {
            id: "L2-Q1", num: "1", type: "mc", points: 1, key: "b",
            prompt: "What is the central theme discussed throughout the radio interview?",
            options: [
              ["a", "An analysis of why traditional nine-to-five schedules are becoming completely illegal in modern corporations."],
              ["b", "A discussion about how mobile technology and remote accessibility have transformed the traditional work-life balance."],
              ["c", "An exploration of how employee productivity increases significantly when working overtime during weekends."],
              ["d", "A comparison between the financial advantages of office jobs and independent freelancing careers."]
            ]
          }
        ]
      },
      {
        title: "Function",
        questions: [
          {
            id: "L2-Q2", num: "2", type: "mc", points: 1, key: "b",
            prompt: "Why does the presenter say, <em>\"That doesn't sound like much of a work–life balance. It sounds like all work\"</em> during the interview?",
            options: [
              ["a", "To express immediate skepticism and challenge the guest's positive opinion of modern connectivity."],
              ["b", "To summarize the guest's previous arguments regarding his positive opinion of constant digital accessibility."],
              ["c", "To voice a common listener concern regarding the pressures of constant digital accessibility."],
              ["d", "To formally transition the dialogue into a critical debate about modern connectivity."]
            ]
          }
        ]
      },
      {
        title: "Organization / Sequence (Structural Gap-Fill)",
        questions: [
          {
            id: "L2-Q3", num: "3", type: "group",
            prompt: "Choose the option that best completes each phrase to complete the macrostructure of the interview:",
            items: [
              {
                id: "L2-Q3.1", type: "mc", points: 1, key: "b",
                label: "Introduction:",
                prompt: "The presenter introduces the guest and his new book focusing on:",
                options: [
                  ["a", "the gradual evolution of traditional working hours and personal time balance."],
                  ["b", "the changing dynamics of modern working hours and personal time balance"],
                  ["c", "the shifting relationship between professional duties and private lives balance."],
                  ["d", "the modern transition away from fixed office schedules and private lives balance."]
                ]
              },
              {
                id: "L2-Q3.2", type: "mc", points: 1, key: "c",
                label: "Contrast (Past vs. Present):",
                prompt: "Chris explains how traditional workplaces maintained a clear separation between professional duties and:",
                options: [
                  ["a", "divide lunch breaks and mandatory team meetings time equally"],
                  ["b", "separate official corporate headquarters and regional offices"],
                  ["c", "distinct professional responsibilities and private lives"],
                  ["d", "different schedules for office hours and home hours"]
                ]
              },
              {
                id: "L2-Q3.3", type: "mc", points: 1, key: "d",
                label: "The Turning Point:",
                prompt: "The conversation shifts to how modern technology enables constant accessibility through:",
                options: [
                  ["a", "mobile networks and office devices"],
                  ["b", "local network servers and office computers"],
                  ["c", "remote phones and digital devices"],
                  ["d", "mobile phones and portable computers"]
                ]
              },
              {
                id: "L2-Q3.4", type: "mc", points: 1, key: "c",
                label: "Conclusion:",
                prompt: "Chris resolves the tension by emphasizing the practical benefits of new:",
                options: [
                  ["a", "flexible corporate hours and enforced office presence"],
                  ["b", "extended forty-hour weekly shifts and mandatory overtime"],
                  ["c", "flexible working arrangements and location independence"],
                  ["d", "standardized working duties and scheduled out of office hours"]
                ]
              }
            ]
          }
        ]
      },
      {
        title: "Factual information",
        questions: [
          {
            id: "L2-Q4", num: "4", type: "match", points: 1, unique: true,
            prompt: "Match each workplace characteristic (1–4) with its correct description (a–f). There are two extra options that you will not use.",
            bankTitle: "Descriptions",
            bank: [
              ["a", "Devices like mobile phones and laptops used for handling work during evenings and holidays."],
              ["b", "Strict nine-to-five schedules with a clear separation between professional duties and private lives."],
              ["c", "Mandatory weekly overtime shifts enforced by corporate management regulations."],
              ["d", "Corporate portable laptop computers and cellular communication tools kept inside the main office building."],
              ["e", "Location independence and flexible arrangements allowing people to work from different places and times."],
              ["f", "Centralized office network servers accessed exclusively through secure corporate terminals."]
            ],
            rowsTitle: "Workplace Characteristics",
            numberedRows: true,
            rows: [
              { text: "Traditional office hours", key: "b" },
              { text: "Communication tools of the past", key: "d" },
              { text: "Modern technology access", key: "a" },
              { text: "Current workplace flexibility", key: "e" }
            ]
          }
        ]
      }
    ]
  },

  /* ---------------------------------------------------------------- L3 */
  {
    id: "L3",
    label: "Listening 3",
    kicker: "An Introduction to a Lecture",
    title: "The Psychology of Happiness",
    intro: "You will hear a university lecturer introducing a theory about happiness. Listen carefully and complete the following tasks. You will hear the recording twice.",
    audio: "audio/listening-3.mp3",
    parts: [
      {
        title: "Part A. Multiple choice",
        instructions: "Choose the best answer (a, b, c, or d).",
        questions: [
          {
            id: "L3-Q1", num: "1", type: "mc", points: 1, key: "b",
            prompt: "What is the main purpose of the lecture?",
            options: [
              ["a", "To explain why some people experience more happiness than others."],
              ["b", "To introduce a psychological theory about happiness and concentration."],
              ["c", "To compare traditional psychology with different approaches to mental health."],
              ["d", "To describe practical techniques for becoming happier in everyday life."]
            ]
          },
          {
            id: "L3-Q2", num: "2", type: "mc", points: 1, key: "c",
            prompt: "Why does the lecturer mention artists working in a studio?",
            options: [
              ["a", "To demonstrate that creative professions are more satisfying than others."],
              ["b", "To explain the reason why artists often work for long periods without resting."],
              ["c", "To illustrate the kind of intense concentration associated with flow."],
              ["d", "To suggest that artistic activities are the most effective way to achieve happiness."]
            ]
          }
        ]
      },
      {
        title: "Part B. Sequencing",
        questions: [
          {
            id: "L3-Q3", num: "3", type: "sequence", points: 0.5, unique: true,
            prompt: "Put the following stages of the lecture in the order in which they are introduced. Write letters a to d.",
            note: "a = first stage, d = last stage",
            choices: ["a", "b", "c", "d"],
            rows: [
              { text: "The lecturer explains the meaning of flow.", key: "c" },
              { text: "The lecturer describes how artists inspired the theory.", key: "d" },
              { text: "The lecturer introduces a question about a happy life.", key: "a" },
              { text: "The lecturer explains the importance of how people perceive events.", key: "b" }
            ]
          }
        ]
      },
      {
        title: "Part C. Matching",
        questions: [
          {
            id: "L3-Q4", num: "4", type: "match", points: 1, unique: true,
            prompt: "Match each idea with the correct explanation. There are TWO extra options.",
            bankTitle: "Ideas",
            bank: [
              ["a", "Positive psychology"],
              ["b", "The theory of flow"],
              ["c", "The role of perception"]
            ],
            rowsTitle: "Explanations",
            rows: [
              { text: "People's interpretation of events influences their happiness.", key: "c" },
              { text: "Happiness depends mainly on achieving personal goals.", key: "" },
              { text: "It explores how people can become happier.", key: "a" },
              { text: "It involves becoming completely absorbed in an activity.", key: "b" },
              { text: "People experience happiness when they avoid difficult situations.", key: "" }
            ]
          }
        ]
      },
      {
        title: "Part D. Gap filling",
        questions: [
          {
            id: "L3-Q5", num: "5", type: "gap", points: 1,
            prompt: "Complete the sentences with the missing information. Write NO MORE THAN TWO WORDS in each gap.",
            blanks: [
              { letter: "a", text: "According to the lecturer, some people associate psychology with studying what is ___ with us.", accept: ["wrong"] },
              { letter: "b", text: "People who have experienced a state of intense concentration often find it difficult to ___ the experience.", accept: ["explain"] },
              { letter: "c", text: "The lecturer compares the experience of flow to being carried away by the water in a ___.", accept: ["river"] }
            ]
          }
        ]
      }
    ]
  }
];
