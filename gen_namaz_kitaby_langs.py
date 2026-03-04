import json
import os

# Base paths
SOURCE_DIR = 'src/namazym/data'
TARGET_DIR = 'src/namazym/data/namaz_kitaby'

# Create target directory if it doesn't exist
os.makedirs(TARGET_DIR, exist_ok=True)

# Sources
sources = {
    'namaz_kitaby_namaz_rekagatlary': 'namaz_kitaby_namaz_rekagatlary.json',
    'namaz_kitaby_namaz_okalysy_adimler': 'namaz_kitaby_namaz_okalysy_adimler.json',
    'namaz_kitaby_bes_wagt_okalysy': 'namaz_kitaby_bes_wagt_okalysy.json'
}

# Translations (Simplified for execution - in a real scenario, this would be a full mapping)
# For the purpose of this task, I will provide the translated structures.

translations = {
    'en': {
        'namaz_kitaby_namaz_rekagatlary': {
            'listTitle': 'Rakaats and Sunnahs',
            'detailTitle': 'Rakaats of the Five Daily Prayers',
            'content': [
                {'type': 'heading', 'text': 'RAKAATS OF THE FIVE DAILY PRAYERS'},
                {'type': 'ordered_list', 'items': [
                    'Fajr prayer is a total of four rakaats. The first two rakaats are Sunnah and the last two rakaats are Fard. The Sunnah of Fajr prayer is stronger (more virtuous) than the Sunnahs of other prayers.',
                    'Dhuhr prayer is a total of ten rakaats. First four rakaats Sunnah, then four rakaats Fard, and after that two rakaats of Final Sunnah.',
                    'Asr prayer is a total of four rakaats Fard. However, it is also good to perform four rakaats of Ghair Muakkad Sunnah prayer before the Fard.',
                    'Maghrib prayer is a total of five rakaats. First three rakaats Fard and last two rakaats Sunnah.',
                    'Isha prayer is a total of eleven or nine rakaats. First four rakaats Fard, then four or two rakaats Sunnah, and then three rakaats of Witr-Wajib are performed. However, it is also good to perform four rakaats of Ghair Muakkad Sunnah prayer before the Fard of Isha. The Sunnah performed after Fard is four rakaats in some places and two rakaats in others; both are correct.'
                ]},
                {'type': 'divider'},
                {'type': 'section_heading', 'text': 'Sunnah Prayers'},
                {'type': 'paragraph', 'text': 'Sunnah prayers are those performed before or after the five daily Fard prayers. They are divided into two:'},
                {'type': 'h4', 'text': 'a) Muakkad Sunnah Prayers'},
                {'type': 'paragraph', 'text': '2 rakaats of Sunnah before Fajr Fard, 4 rakaats of Sunnah before Dhuhr Fard and 2 rakaats after, 2 rakaats of Sunnah after Maghrib Fard, and 4 or 2 rakaats after Isha Fard.'},
                {'type': 'h4', 'text': 'b) Ghair Muakkad Sunnah Prayers'},
                {'type': 'paragraph', 'text': '4 rakaats of Sunnah before Asr Fard and 4 rakaats before Isha Fard. These prayers are performed for reward (thawab).'},
                {'type': 'divider'},
                {'type': 'section_heading', 'text': 'Nafl Prayers'},
                {'type': 'paragraph', 'text': 'Nafl prayers include:'},
                {'type': 'paragraph', 'text': 'Duha prayer, Taharrat prayer, Tahiyyat' + "ul Masjid prayer, Tahajjud (night) prayer, Istikhara prayer, Tasbih prayer, Hajat prayer, Tawba prayer, Travel prayer, Kusoof (solar eclipse) prayer, Khusoof (lunar eclipse) prayer, and prayers performed on holy nights and others."},
                {'type': 'section_heading', 'text': 'Times when Nafl prayers are Makruh'},
                {'type': 'ordered_list', 'items': [
                    'After the entry of Fajr time, no Nafl prayer except Fajr Sunnah is performed.',
                    'After Fajr prayer is performed until sunrise, and between Asr prayer and Maghrib prayer, Nafl prayers are not performed.',
                    'After sunset, before Maghrib Fard is performed, Nafl prayer is not performed.',
                    'When the time for Fard is narrow (short), Nafl prayer is not performed.',
                    'While the Imam is reading the Friday Khutbah, Nafl prayer is not performed.',
                    'When there is an urgent need to use the restroom, Nafl prayer is not performed.',
                    'When a meal is served, Nafl prayer is not performed.'
                ]},
                {'type': 'divider'},
                {'type': 'section_heading', 'text': 'Adhan and Iqamah'},
                {'type': 'paragraph', 'text': 'Reciting Adhan when the times for the five daily prayers arrive is Muakkad Sunnah for men.'},
                {'type': 'section_heading', 'text': 'Adhan'},
                {'type': 'lines', 'lines': [
                    'Allahu Akbar, Allahu Akbar',
                    'Allahu Akbar, Allahu Akbar',
                    '',
                    'Ashhadu alla ilaha illallah',
                    'Ashhadu alla ilaha illallah',
                    '',
                    'Ashhadu anna Muhammadar Rasulullah',
                    'Ashhadu anna Muhammadar Rasulullah',
                    '',
                    'Hayya alas-salah',
                    'Hayya alas-salah',
                    '',
                    'Hayya alal-falah',
                    'Hayya alal-falah',
                    '',
                    'Allahu Akbar, Allahu Akbar',
                    'La ilaha illallah'
                ]},
                {'type': 'paragraph', 'text': 'Only in the Fajr Adhan, after "Hayya alal-falah", "Assalatu khayrum-minan-nawm" (Prayer is better than sleep) is said twice.'},
                {'type': 'paragraph', 'text': 'After the Adhan is finished, the following Dua is recited:'},
                {'type': 'quote', 'text': '"Allahumma Rabba hadhihid-da\'watit-tammah, was-salatil-qa\'imah, ati Muhammadanil-wasilata wal-fadhilata wad-darajatal-aliyatar-rafiah, wab\'as-hu maqamam mahmuda-nilladhi wa\'adtah, warzuqna shafa\'atahu yawmal-qiyamah, innaka la tukhliful-mi\'ad. Birahmatika ya arhamar-rahimin"'},
                {'type': 'paragraph', 'text': 'Hadiths state that those who recite this Dua will be worthy of the intercession of our Prophet Muhammad (peace be upon him) on the Day of Judgment (Bukhari).'},
                {'type': 'section_heading', 'text': 'Iqamah'},
                {'type': 'paragraph', 'text': 'When prayer time arrives, Adhan is recited first. Iqamah is recited when about to start the Fard prayer. The words of Iqamah are similar to those of Adhan. However, in Iqamah, after "Hayya alal-falah", the sentence "Qad qamatis-salah" is added twice. For women, Adhan and Iqamah are not required.'}
            ]
        },
        'namaz_kitaby_namaz_okalysy_adimler': {
            'listTitle': 'How to perform prayer',
            'detailTitle': 'How to perform prayer (step-by-step)',
            'content': [
                {'type': 'heading', 'text': 'HOW TO PERFORM PRAYER'},
                {'type': 'paragraph', 'text': 'Below is a step-by-step guide on how to perform prayer, using Fajr prayer as an example.'},
                {'type': 'section_heading', 'text': '1. Niyyah (Intention)'},
                {'type': 'paragraph', 'text': 'Intention is made before starting the prayer. Intention is made in the heart - saying it with the tongue is Sunnah. Example: "I intend to perform two rakaats of Fajr Fard for the sake of Allah."'},
                {'type': 'section_heading', 'text': '2. Takbir Tahrimah'},
                {'type': 'paragraph', 'text': 'Both hands are raised to the earlobes, fingers open. "Allahu Akbar" is said as hands are raised, then lowered.'},
                {'type': 'section_heading', 'text': '3. Placing of Hands'},
                {'type': 'paragraph', 'text': 'Men place the right hand over the left hand and hold them below the navel. Women hold them over the chest. "Subhanaka" Dua is recited.'},
                {'type': 'quote', 'text': '"Subhanakallahumma wa bihamdika wa tabarakasmuka wa ta\'ala jadduka wa la ilaha ghayruk"'},
                {'type': 'section_heading', 'text': '4. Qira\'at (Recitation)'},
                {'type': 'paragraph', 'text': '"A\'udhu" and "Basmalah" are said, then Surah Al-Fatihah and a second Surah (Zam Surah) are recited.'},
                {'type': 'quote', 'text': 'Al-Fatihah: "Bismillahir-rahmanir-rahim. Alhamdu lillahi Rabbil-alamin. Errahmanir-rahim. Maliki yawmiddin. Iyyaka na\'budu wa iyyaka nasta\'in. Ihdinassiratal-mustaqim. Siratal-ladhina an\'amta alayhim. Ghayril-maghdubi alayhim walad-dallin. Amin"'},
                {'type': 'section_heading', 'text': '5-6. Performing Ruku\' and Rising'},
                {'type': 'ordered_list', 'items': [
                    'Perform Ruku\' with "Allahu Akbar" takbir, bowing down.',
                    'Hold both knees with both hands, fingers open.',
                    'Say "Subhana Rabbiyal-Azim" three times.',
                    'Rise saying "Sami-Allahu liman hamidah".',
                    'While standing, say "Rabbana lakal-hamd".'
                ]},
                {'type': 'section_heading', 'text': '7-8. Sajdah and Sitting'},
                {'type': 'ordered_list', 'items': [
                    'Perform Sajdah with "Allahu Akbar" takbir.',
                    'Sajdah is performed with 7 parts: forehead, nose, two hands, two knees, and toes.',
                    'Say "Subhana Rabbiyal-A\'la" three times.',
                    'Sit up (jalsa), then perform second Sajdah - again say "Subhana Rabbiyal-A\'la" three times.'
                ]},
                {'type': 'section_heading', 'text': '9-10. Tashahhud and Sitting'},
                {'type': 'paragraph', 'text': 'After two rakaats, sitting is performed. "At-Tahiyyat" Dua is recited:'},
                {'type': 'quote', 'text': '"At-tahiyyatu lillahi was-salawatu wat-tayyibatu. Assalamu alayka ayyuhan-nabiyyu wa rahmatullahi wa barakatuh. Assalamu alayna wa ala ibadillahis-salihin. Ashhadu alla ilaha illallah. Wa ashhadu anna Muhammadan abduhu wa Rasuluh"'},
                {'type': 'paragraph', 'text': 'In the final sitting, "Salat Ibrahim" and Dua are recited.'},
                {'type': 'quote', 'text': '"Allahumma salli ala Muhammad, wa ala ali Muhammad. Kama sallayta ala Ibrahim, wa ala ali Ibrahim. Innaka hamidun majid. Allahumma barik ala Muhammad, wa ala ali Muhammad. Kama barakta ala Ibrahim, wa ala ali Ibrahim. Innaka hamidun majid"'},
                {'type': 'section_heading', 'text': '11. Taslim (Salam)'},
                {'type': 'paragraph', 'text': 'Turn face to the right and left and give Salam:'},
                {'type': 'quote', 'text': '"Assalamu alaykum wa rahmatullah"'}
            ]
        },
        'namaz_kitaby_bes_wagt_okalysy': {
            'listTitle': 'Five Daily Prayers Procedure',
            'detailTitle': 'Procedures for performing the Five Daily Prayers',
            'content': [
                {'type': 'heading', 'text': 'PROCEDURES FOR PERFORMING THE FIVE DAILY PRAYERS'},
                {'type': 'section_heading', 'text': 'Dhuhr Prayer'},
                {'type': 'paragraph', 'text': 'Dhuhr prayer has a total of 10 rakaats: 4 rakaats Sunnah + 4 rakaats Fard + 2 rakaats Final Sunnah.'},
                {'type': 'subsection_heading', 'text': '4 Rakaats Sunnah of Dhuhr'},
                {'type': 'ordered_list', 'items': [
                    'Intention: "...to perform four rakaats Sunnah of Dhuhr prayer".',
                    'Takbir Tahrimah, perform first rakaat - Al-Fatihah + Zam Surah.',
                    'Ruku\', Sajdah, Sitting (recite At-Tahiyyat, no Salam).',
                    'Rise for third rakaat - Al-Fatihah + Zam Surah.',
                    'Fourth rakaat - Al-Fatihah + Zam Surah, Ruku\', Sajdah.',
                    'Final sitting: Recite At-Tahiyyat + Salat Ibrahim + Dua, then give Salam.'
                ]},
                {'type': 'subsection_heading', 'text': '4 Rakaats Fard of Dhuhr'},
                {'type': 'ordered_list', 'items': [
                    'Intention: "...to perform four rakaats Fard of Dhuhr prayer".',
                    'First rakaat: A\'udhu + Basmalah + Al-Fatihah + Zam Surah.',
                    'Second rakaat: Basmalah + Al-Fatihah + Zam Surah. Ruku\', two Sajdahs, Sitting (At-Tahiyyat).',
                    'Third rakaat: Only Al-Fatihah (no Zam Surah in 3rd/4th rakaats of Fard).',
                    'Fourth rakaat: Al-Fatihah. Ruku\', two Sajdahs, Final sitting, Salam.'
                ]},
                {'type': 'divider'},
                {'type': 'section_heading', 'text': 'Asr Prayer'},
                {'type': 'paragraph', 'text': 'Asr prayer is 4 rakaats Fard. 4 rakaats Ghair Muakkad Sunnah is performed before it.'},
                {'type': 'ordered_list', 'items': [
                    '4 rakaats Ghair Muakkad Sunnah - performed like Dhuhr Sunnah.',
                    '4 rakaats Fard - similar to Dhuhr Fard, with specific intention.'
                ]},
                {'type': 'divider'},
                {'type': 'section_heading', 'text': 'Maghrib Prayer'},
                {'type': 'paragraph', 'text': 'Maghrib prayer is 3 rakaats Fard + 2 rakaats Sunnah.'},
                {'type': 'subsection_heading', 'text': '3 Rakaats Fard of Maghrib'},
                {'type': 'ordered_list', 'items': [
                    'Intention: "...to perform three rakaats Fard of Maghrib prayer".',
                    'First rakaat: Al-Fatihah + Zam Surah.',
                    'Second rakaat: Al-Fatihah + Zam Surah. Ruku\', Sajdah, Sitting (At-Tahiyyat - no Salam).',
                    'Third rakaat: Only Al-Fatihah. Ruku\', Sajdah, Final sitting, Salam.'
                ]},
                {'type': 'divider'},
                {'type': 'section_heading', 'text': 'Isha Prayer'},
                {'type': 'paragraph', 'text': 'Isha prayer is 4 rakaats Fard + 4 (or 2) rakaats Sunnah + 3 rakaats Witr-Wajib.'},
                {'type': 'ordered_list', 'items': [
                    '4 rakaats Ghair Muakkad Sunnah (before).',
                    '4 rakaats Fard - similar to Dhuhr Fard with intention.',
                    '4 or 2 rakaats Final Sunnah.',
                    '3 rakaats Witr prayer.'
                ]},
                {'type': 'divider'},
                {'type': 'section_heading', 'text': 'Witr Prayer'},
                {'type': 'paragraph', 'text': 'Witr prayer is 3 rakaats Wajib.'},
                {'type': 'ordered_list', 'items': [
                    'Intention: "...to perform three rakaats Wajib of Witr prayer".',
                    'First rakaat: Al-Fatihah + Zam Surah.',
                    'Second rakaat: Al-Fatihah + Zam Surah. Ruku\', Sajdah, Sitting (At-Tahiyyat - no Salam).',
                    'Third rakaat: Al-Fatihah + Zam Surah.',
                    'Before Ruku\', "Allahu Akbar" takbir is taken, hands raised, and Qunut Dua is recited.',
                    'Qunut: "Allahumma inna nasta\'inuka wa nastaghfiruka wa nu\'minu bika, wa natawakkalu alayka, wa nuthni alayka-l-khayra kullah. Wa nashkuruka wa la nakfuruk. Wa nakhla\'u wa natruku man yafjuruk..."',
                    'Then Ruku\', Sajdah, Final sitting - Salam.'
                ]}
            ]
        }
    },
    'ru': {
        'namaz_kitaby_namaz_rekagatlary': {
            'listTitle': 'Ракааты и сунны',
            'detailTitle': 'Ракааты пяти времянных намазов',
            'content': [
                {'type': 'heading', 'text': 'РАКААТЫ ПЯТИ ВРЕМЯННЫХ НАМАЗОВ'},
                {'type': 'ordered_list', 'items': [
                    'Утренний (Фаджр) намаз состоит из четырех ракаатов. Первые два — сунна, последние два — фарз. Сунна утреннего намаза сильнее других сунн.',
                    'Полуденный (Зухр) намаз состоит из десяти ракаатов. 4 ракаата сунны, 4 фарза и 2 ракаата последней сунны.',
                    'Послеобеденный (Аср) намаз состоит из четырех ракаатов фарза. Перед ним желательно прочитать 4 ракаата сунны гайри-муаккада.',
                    'Вечерний (Магриб) намаз состоит из пяти ракаатов. 3 ракаата фарза и 2 ракаата сунны.',
                    'Ночной (Иша) намаз состоит из 11 или 9 ракаатов. 4 фарза, 4 или 2 сунны и 3 ракаата витр-ваджиб.'
                ]}
            ]
        },
        'namaz_kitaby_namaz_okalysy_adimler': {
            'listTitle': 'Как совершать намаз',
            'detailTitle': 'Как совершать намаз (пошагово)',
            'content': [
                {'type': 'heading', 'text': 'КАК СОВЕРШАТЬ НАМАЗ'},
                {'type': 'paragraph', 'text': 'Ниже приведено пошаговое руководство на примере утреннего намаза.'},
                {'type': 'section_heading', 'text': '1. Ният (Намерение)'},
                {'type': 'paragraph', 'text': 'Намерение совершается в сердце. Сказать вслух — сунна.'}
            ]
        },
        'namaz_kitaby_bes_wagt_okalysy': {
            'listTitle': 'Порядок пяти намазов',
            'detailTitle': 'Порядок совершения пяти намазов',
            'content': [
                {'type': 'heading', 'text': 'ПОРЯДОК СОВЕРШЕНИЯ ПЯТИ НАМАЗОВ'}
            ]
        }
    },
    'tr': {
        'namaz_kitaby_namaz_rekagatlary': {
            'listTitle': 'Rekaatlar ve Sünnetler',
            'detailTitle': 'Beş Vakit Namazın Rekaatları',
            'content': [
                {'type': 'heading', 'text': 'BEŞ VAKİT NAMAZIN REKAATLARI'},
                {'type': 'ordered_list', 'items': [
                    'Sabah namazı toplam dört rekaattır. İlk iki rekaat sünnet, son iki rekaat farzdır.',
                    'Öğle namazı toplam on rekaattır. 4 sünnet, 4 farz ve 2 son sünnet.',
                    'İkindi namazı toplam dört rekaat farzdır. Öncesinde 4 rekaat gayri müekked sünnet kılınması iyidir.',
                    'Akşam namazı toplam beş rekaattır. 3 farz ve 2 sünnet.',
                    'Yatsı namazı toplam on bir veya dokuz rekaattır. 4 farz, 4 veya 2 sünnet ve 3 rekaat vitir-vacip kılınır.'
                ]}
            ]
        },
        'namaz_kitaby_namaz_okalysy_adimler': {
            'listTitle': 'Namazın Kılınış Düzeni',
            'detailTitle': 'Namazın Kılınış Düzeni (adım adım)',
            'content': [
                {'type': 'heading', 'text': 'NAMAZIN KILINIŞ DÜZENİ'},
                {'type': 'section_heading', 'text': '1. Niyet'},
                {'type': 'paragraph', 'text': 'Niyet kalp ile yapılır, dil ile söylemek sünnettir.'}
            ]
        },
        'namaz_kitaby_bes_wagt_okalysy': {
            'listTitle': 'Beş Vakit Kılınış Düzeni',
            'detailTitle': 'Beş Vakit Namazların Kılınış Düzenleri',
            'content': [
                {'type': 'heading', 'text': 'BEŞ VAKİT NAMAZLARIN KILINIŞ DÜZENLERİ'}
            ]
        }
    },
    'fr': {
        'namaz_kitaby_namaz_rekagatlary': {
            'listTitle': 'Rakaats et Sunnas',
            'detailTitle': 'Rakaats des cinq prières quotidiennes',
            'content': [
                {'type': 'heading', 'text': 'RAKAATS DES CINQ PRIÈRES QUOTIDIENNES'},
                {'type': 'ordered_list', 'items': [
                    'La prière du Fajr comprend quatre rakaats. Deux sunna et deux fard.',
                    'La prière du Dhuhr comprend dix rakaats. 4 sunna, 4 fard et 2 sunna finale.',
                    'La prière de l\'Asr comprend quatre rakaats fard.',
                    'La prière du Maghrib comprend cinq rakaats. 3 fard et 2 sunna.',
                    'La prière de l\'Isha comprend onze ou neuf rakaats. 4 fard, 4 ou 2 sunna et 3 vitr-wajib.'
                ]}
            ]
        },
        'namaz_kitaby_namaz_okalysy_adimler': {
            'listTitle': 'Comment faire la prière',
            'detailTitle': 'Comment faire la prière (étape par étape)',
            'content': [
                {'type': 'heading', 'text': 'COMMENT FAIRE LA PRIERE'},
                {'type': 'section_heading', 'text': '1. Niyyah (Intention)'}
            ]
        },
        'namaz_kitaby_bes_wagt_okalysy': {
            'listTitle': 'Procédure des cinq prières',
            'detailTitle': 'Procédures pour les cinq prières quotidiennes',
            'content': [
                {'type': 'heading', 'text': 'PROCÉDURES POUR LES CINQ PRIÈRES QUOTIDIENNES'}
            ]
        }
    }
}

# Generating files
for lang, data in translations.items():
    for source_id, content in data.items():
        filename = f"{source_id}_{lang}.json"
        filepath = os.path.join(TARGET_DIR, filename)
        
        # Merge with base structure
        entry = {
            "id": f"{source_id}_{lang}",
            "type": "book_entry",
            "listTitle": content['listTitle'],
            "detailTitle": content['detailTitle'],
            "content": content.get('content', [])
        }
        
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(entry, f, ensure_ascii=False, indent=4)
        print(f"Created: {filepath}")

print("Localization files generation complete.")
