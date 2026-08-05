export const penicheBerlengas = {
    "id": 11,
    "title": "Пенише и остров Берленгаш",
    "subtitle": "Океанский переход, морские пещеры, крепость на скале и купание в бухте",
    "duration": "12–13 часов",
    "distance": "~5 км пешком",
    "difficulty": "Средняя (солнце, ветер и лодка)",
    "category": "Atlantic island day",
    "image": "https://upload.wikimedia.org/wikipedia/commons/8/8f/2026-06-21_Berlengas_01.jpg",
    "imageFallback": "https://upload.wikimedia.org/wikipedia/commons/b/bf/2026-06-21_Berlengas_02.jpg",
    "ready": true,
    "mapCenter": [39.387, -9.445],
    "mapZoom": 11,
    "tip": "Бронируйте билет с 4–6 часами на Berlenga Grande: при короткой высадке придётся выбирать между крепостью, пещерами и купанием. Для каждого пассажира заранее нужен BerlengasPass; ICNF допускает на остров одновременно не больше 550 человек. Приезжайте в порт минимум за 30 минут и не вставляйте перед катером никаких остановок. Если море отменит рейс, запасной день складывается на материке из Cabo Carvoeiro, Papôa и Baleal. Вода, еда, ветровка, закрытая обувь и защита от солнца нужны с собой.",
    "places": [
        {
            "name": "Porto de Peniche",
            "nameRu": "Порт Пенише и посадка на катер",
            "coords": [39.3555, -9.3805],
            "description": "Начинайте прямо в порту. Подтвердите билет у оператора, держите BerlengasPass офлайн и уточните время обратного рейса до посадки. Большой паром идёт около 40–45 минут, скоростной катер быстрее, но сильнее чувствует волну. Если вас укачивает, место ближе к корме и средство от морской болезни важнее любой материковой достопримечательности.",
            "galleryCategories": ["Port of Peniche"],
            "galleryKeywords": ["port", "peniche", "boat", "berlengas"],
            "sourceLabel": "BerlengasPass — правила доступа",
            "sourceUrl": "https://berlengaspass.icnf.pt/faq",
            "mapsQuery": "Porto de Peniche"
        },
        {
            "transit": {
                "note": "На Берленгу ходят лицензированные операторы. Время зависит от типа судна и моря; при отмене не ищите случайную лодку, а переходите к запасному плану по Пенише.",
                "options": [
                    {
                        "mode": "ferry",
                        "duration": "30–45 мин",
                        "distance": "10 км",
                        "recommended": true,
                        "detail": "Peniche → Berlenga Grande; билет и BerlengasPass заранее"
                    }
                ]
            },
            "name": "Praia do Carreiro do Mosteiro",
            "nameRu": "Гавань Берленги и Каррейру-ду-Моштейру",
            "coords": [39.4116, -9.5077],
            "description": "Катер входит в естественную гавань под белыми домами рыбацкого квартала. Сразу найдите причал маленьких экскурсионных лодок и узнайте ближайшее отправление к пещерам; расписание меняется вместе с морем. Сам пляж пока оставьте на потом: перед обратным рейсом он работает гораздо лучше, чем в первые минуты после качки.",
            "galleryCategories": ["Berlengas"],
            "galleryKeywords": ["berlenga", "carreiro", "mosteiro", "harbour"],
            "sourceLabel": "ICNF — природный резерват",
            "sourceUrl": "https://www.icnf.pt/conservacao/rnapareasprotegidas/reservasnaturais/rnberlengas",
            "mapsQuery": "Praia do Carreiro do Mosteiro Berlenga"
        },
        {
            "transit": {
                "note": "Маленькая лодка показывает ту часть острова, которой не видно с тропы. Экскурсию бронируют у причала или вместе с основным билетом; она проходит только при подходящем море.",
                "options": [
                    {
                        "mode": "ferry",
                        "duration": "30 мин",
                        "distance": "вокруг южных скал",
                        "recommended": true,
                        "detail": "стеклянное дно, Gruta Azul и природный тоннель Furado Grande"
                    }
                ]
            },
            "name": "Grutas da Berlenga e Furado Grande",
            "nameRu": "Морские пещеры и тоннель Фураду-Гранди",
            "coords": [39.4116, -9.5077],
            "description": "С воды открываются Gruta Azul, узкий природный тоннель Furado Grande и скалы, которые с островной тропы выглядят обычной стеной. Полчаса на маленькой лодке дают Берленге больше, чем отдельный крюк к маяку. Если море неспокойно и экскурсии отменены, не рискуйте и сразу переходите к пешей части.",
            "galleryFiles": [
                "File:2026-06-21 Berlengas 01.jpg",
                "File:2026-06-21 Berlengas 02.jpg",
                "File:2026-06-21 Berlengas 03.jpg"
            ],
            "galleryCategories": ["Berlengas"],
            "galleryKeywords": ["berlenga", "cave", "furado grande", "boat"],
            "sourceLabel": "Viamar — варианты посещения Берленги",
            "sourceUrl": "https://viamar-berlenga.com/en/pacotes.html",
            "mapsQuery": "Furado Grande Berlenga"
        },
        {
            "transit": {
                "note": "Тропа к крепости открыта солнцу и местами идёт по камню. Сандалии для этого участка не годятся, а ветровка часто оказывается полезнее, чем кажется в Пенише.",
                "options": [
                    {
                        "mode": "walk",
                        "duration": "35 мин",
                        "distance": "1,9 км",
                        "recommended": true,
                        "detail": "по маркированной тропе вдоль скал"
                    }
                ]
            },
            "name": "Forte de São João Baptista",
            "nameRu": "Крепость Сан-Жуан-Батишта",
            "coords": [39.4079, -9.5126],
            "description": "Крепость стоит на отдельной скале, соединённой с островом узким проходом. Сюда стоит идти не ради галочки «увидеть форт», а ради дороги: вода меняет цвет, чайки летят почти на уровне глаз, а впереди всё время висит каменная крепость. На месте посидите у стены и не спешите обратно.",
            "galleryFiles": [
                "File:2026-06-21 Berlengas 04.jpg",
                "File:2026-06-21 Berlengas 05.jpg",
                "File:2026-06-21 Berlengas 06.jpg"
            ],
            "galleryCategories": ["Fort of São João Baptista (Berlengas)"],
            "galleryKeywords": ["fort", "sao joao baptista", "berlenga", "cliffs"],
            "sourceLabel": "ICNF — природный резерват",
            "sourceUrl": "https://www.icnf.pt/conservacao/rnapareasprotegidas/reservasnaturais/rnberlengas",
            "mapsQuery": "Forte de São João Baptista Berlenga"
        },
        {
            "transit": {
                "note": "От крепости поднимитесь обратно к главной тропе и спускайтесь в гавань. Маяк останется в стороне: отдельный крюк к нему слабее пещер и отнимает запас перед обратным катером.",
                "options": [
                    {
                        "mode": "walk",
                        "duration": "40 мин",
                        "distance": "1,9 км",
                        "recommended": true,
                        "detail": "обратно к гавани и пляжу"
                    }
                ]
            },
            "name": "Praia do Carreiro do Mosteiro",
            "nameRu": "Купание перед обратным катером",
            "coords": [39.4116, -9.5077],
            "description": "Финальный час оставьте без программы. В спокойную погоду вода в маленькой бухте прозрачная и защищённая, но пляж тесный, поэтому не раскладывайте вещи на полдня. Следите за временем посадки и выходите из воды заранее: подъём к причалу короткий, а ждать опоздавших оператор не обязан.",
            "galleryFiles": [
                "File:2026-06-21 Berlengas 07.jpg",
                "File:2026-06-21 Berlengas 08.jpg",
                "File:2026-06-21 Berlengas 09.jpg"
            ],
            "galleryCategories": ["Berlengas"],
            "galleryKeywords": ["carreiro do mosteiro", "beach", "berlenga", "swimming"],
            "sourceLabel": "ICNF — природный резерват",
            "sourceUrl": "https://www.icnf.pt/conservacao/rnapareasprotegidas/reservasnaturais/rnberlengas",
            "mapsQuery": "Praia do Carreiro do Mosteiro Berlenga"
        }
    ]
};
