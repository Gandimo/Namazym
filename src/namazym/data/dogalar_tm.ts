// ── Legacy single-prayer type (namaz prayers) ──────────────────────────────
export interface DogaItem {
    id: string;
    title: string;
    text_ar: string;
    text_read: string;
    blocks?: never; // discriminator
}

// ── Block-based type (süreler / aýatlar) ───────────────────────────────────
export type DogaBlock =
    | { type: 'subtitle'; text: string }
    | { type: 'sectionTitle'; text: string }
    | { type: 'verse_lines'; lines: string[] }
    | { type: 'heading'; text: string }
    | { type: 'text'; text: string }
    | { type: 'list'; text: string };

export interface DogaBlockItem {
    id: string;
    title: string;
    text_ar?: never;
    text_read?: never;
    blocks: DogaBlock[];
}

export type AnyDogaItem = DogaItem | DogaBlockItem;

// ── Namaz prayers ──────────────────────────────────────────────────────────
export const DOGALAR_LIST: AnyDogaItem[] = [
    {
        id: '1',
        title: '«Sübhâneke» dogasy',
        text_ar: 'سُبْحَانَكَ اللَّهُمَّ وَبِحَمْدِكَ وَتَبَارَكَ اسْمُكَ وَتَعَالَى جَدُّكَ وَلَا إِلَهَ غَيْرُكَ',
        text_read: `«Sübha:nekalla:hümme we bihamdike we tebä:ra kesmuke we te'a: lȧ: jedduke we lä: ilä: he gaýruk».`,
    },
    {
        id: '2',
        title: '«Tahyyýat» dogasy',
        text_ar: 'التَّحِيَّاتُ لِلّٰهِ وَالصَّلَوَاتُ وَالطَّيِّبَاتُ، السَّلَامُ عَلَيْكَ أَيُّهَا النَّبِيُّ وَرَحْمَةُ اللّٰهِ وَبَرَكَاتُهُ، السَّلَامُ عَلَيْنَا وَعَلَى عِبَادِ اللّٰهِ الصَّالِحِينَ، أَشْهَدُ أَنْ لَا إِلٰهَ إِلَّا اللّٰهُ وَأَشْهَدُ أَنَّ مُحَمَّدًا عَبْدُهُ وَرَسُولُهُ',
        text_read: '«Et-Tehyyýä:tü lillȧ:hi wes-salewȧ:tü wet-tayyibȧ:t. Esselä:mu aleýke eýýühen-nebiyýü we rahmetulla:hi we berakȧ:tuh. Esselä:mu aleýnȧ: we alȧ: ybȧ:dilla:his-sa:lihy:n. Eşhedu ellȧ: ilȧ:he illalla:hu we eşhedu enne Muhammeden abduhu: we rasu:luh».',
    },
    {
        id: '3',
        title: '«Allâhümme salli» dogasy',
        text_ar: 'اللَّهُمَّ صَلِّ عَلَىٰ مُحَمَّدٍ وَعَلَىٰ آلِ مُحَمَّدٍ، كَمَا صَلَّيْتَ عَلَىٰ إِبْرَاهِيمَ وَعَلَىٰ آلِ إِبْرَاهِيمَ، إِنَّكَ حَمِيدٌ مَجِيدٌ',
        text_read: '«Alla:hümme salli alȧ: Muhammedi:w we alȧ: ä:li Muhammed. Kemȧ: salleýte alȧ: Ibra:hi:me we alȧ: ä:li Ibra:hi:m. Inneke hami:dum meji:d».',
    },
    {
        id: '4',
        title: '«Allâhümme bärik» dogasy',
        text_ar: 'اللَّهُمَّ بَارِكْ عَلَىٰ مُحَمَّدٍ وَعَلَىٰ آلِ مُحَمَّدٍ، كَمَا بَارَكْتَ عَلَىٰ إِبْرَاهِيمَ وَعَلَىٰ آلِ إِبْرَاهِيمَ، إِنَّكَ حَمِيدٌ مَجِيدٌ',
        text_read: '«Alla:hümme bä:rik alȧ: Muhammedi:w we alȧ: ä:li Muhammed. Kemȧ: bä:rakte alȧ: Ibra:hi:me we alȧ: ä:li Ibra:hi:m. Inneke hami:dum meji:d».',
    },
    {
        id: '5',
        title: '«Allâhümmagfirli» dogasy',
        text_ar: 'اللَّهُمَّ اغْفِرْ لِي وَلِوَالِدَيَّ وَلِجَمِيعِ الْمُؤْمِنِينَ وَالْمُؤْمِنَاتِ، وَالْمُسْلِمِينَ وَالْمُسْلِمَاتِ، الْأَحْيَاءِ مِنْهُمْ وَالْأَمْوَاتِ. رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ. بِرَحْمَتِكَ يَا أَرْحَمَ الرَّاحِمِينَ',
        text_read: `«Alla:hümmagfirli: we liwä:lideýýe we lijemi:yl mü'mini: ne wel mü'minä:ti wel muslimi:ne wel-muslimä:ti el-ahýä:i minhum wel-emwä:t. Rabbenä: ä:tinä: fiddünyä: hasenetew we filä:hyrati hasenetew wakynä: azȧ:bennä:r. Birahmetike ýȧ: erhamer-ra:hymi:n».`,
    },
    {
        id: '6',
        title: '«Kunut» dogasy',
        text_ar: 'اللَّهُمَّ إِنَّا نَسْتَعِينُكَ وَنَسْتَغْفِرُكَ وَنَسْتَهْدِيكَ، وَنُؤْمِنُ بِكَ وَنَتُوبُ إِلَيْكَ، وَنَتَوَكَّلُ عَلَيْكَ وَنُثْنِي عَلَيْكَ الْخَيْرَ كُلَّهُ، نَشْكُرُكَ وَلَا نَكْفُرُكَ، وَنَخْلَعُ وَنَتْرُكُ مَنْ يَفْجُرُكَ. اللَّهُمَّ إِيَّاكَ نَعْبُدُ وَلَكَ نُصَلِّي وَنَسْجُدُ، وَإِلَيْكَ نَسْعَى وَنَحْفِدُ، نَرْجُو رَحْمَتَكَ وَنَخْشَى عَذَابَكَ، إِنَّ عَذَابَكَ بِالْكُفَّارِ مُلْحِقٌ',
        text_read: `«Alla:hümme innȧ: neste'y: nuke we nestagfiruke we nestehdi: ke we nu'minu bike we netu:bu ileýke we netewekkelu aleýke we nüsni: aleýkel-haýra küllehü: neşkuruke we lä: nekfuruk. We nahle'u we netruku meý- ýefjuruk.Alla: hümme iýýȧ: ke na'gbudu we leke nusalli: we nesjüdü we ileýke nes'ȧ:.We nahfidu nerju: rahmeteke we nahşȧ: azȧ: beke inne azȧ: beke bil - kuffȧ: ri mulhyk».`,
    },
    {
        id: '7',
        title: 'Namazdan soňra okalýan doga',
        text_ar: 'اللَّهُمَّ تَقَبَّلْ مِنَّا هٰذِهِ الصَّلَاةَ مَعَ جَمِيعِ نُقْصَانَاتِهَا وَلَا تَرُدَّ عَلَيْنَا بِفَضْلِكَ وَجُودِكَ وَكَرَمِكَ بِرَحْمَتِكَ يَا أَرْحَمَ الرَّاحِمِينَ',
        text_read: `Alla:hümme takabbel minnȧ: hä:zhihis-salȧ:te ma\'a jemi:\'y nüksa:nȧ:tiha: welȧ: terruddü aleýnȧ: bifazlike weju:dike we keramike birahmetike ýȧ: erhamer-ra:hymi:n.`,
    },
    {
        id: '8',
        title: 'Nahardan soňra okalýan doga',
        text_ar: 'الْحَمْدُ لِلّٰهِ الَّذِي أَطْعَمَنَا وَسَقَانَا وَجَعَلَنَا مِنَ الْمُسْلِمِينَ. الْحَمْدُ لِلّٰهِ حَمْدًا يُوَافِي نِعْمَتَهُ وَيُكَافِئُ مَزِيدَهُ، وَاغْفِرْ صَاحِبَهُ وَارْحَمْ آكِلَهُ',
        text_read: `Elhamdülillȧ:hillezi: et\'amenȧ: we seka:nȧ: we je\'alenȧ: minel-müslimi:n. Elhamdülillȧ:hi hamden ýüwȧ:fi: ni\'amehü we ýükȧ:fi: mezi:dehü: wagfir sa:hybehü: werham ä:kileh.`,
    },
    {
        id: '9',
        title: '«Azan» dogasy',
        text_ar: 'اللَّهُمَّ رَبَّ هٰذِهِ الدَّعْوَةِ التَّامَّةِ، وَالصَّلَاةِ الْقَائِمَةِ، آتِ مُحَمَّدًا الْوَسِيلَةَ وَالْفَضِيلَةَ، وَالدَّرَجَةَ الْعَالِيَةَ الْرَّفِيعَةَ، وَابْعَثْهُ مَقَامًا مَحْمُودًا الَّذِي وَعَدْتَهُ، وَارْزُقْنَا شَفَاعَتَهُ يَوْمَ الْقِيَامَةِ، إِنَّكَ لَا تُخْلِفُ الْمِيعَادَ. بِرَحْمَتِكَ يَا أَرْحَمَ الرَّاحِمِينَ',
        text_read: `Alla:hümme rabbe hä:zhihid–dagwetit–tä:mmeti, wessalȧ:til–ka:\'imeti, ȧ:ti muhammedenil–wesi:lete wel–fazy:lete wed–derajetel–a:liýeter–rafi:ate, web–ashu maka:mem mahmudenillezi: we\'attehü: werzuknȧ: şefȧ:atehu: ýüwmel–kyýȧ:meti, inneke lȧ: tuhliful–mi:\'a:d. Birahmetike ýȧ: erhamer–ra:hymi:n.`,
    },

    // ── Block-based entries (süreler / aýatlar) ────────────────────────────
    {
        id: 'tebarek_cykmagy_tertibi',
        title: 'Tebärek çykmagyň tertibi',
        blocks: [
            { type: 'subtitle', text: 'E\'u:zü billä:hi mineş-şeyta:nir-raji:m' },
            {
                type: 'verse_lines',
                lines: [
                    '1. Bismillä:hir-rahmä:nir-rahy:m',
                    '2. Elhamdü lilla:hi rabbil-a:lemi:n. 3. Er-rahmä:nir-rahy:m.',
                    '4. Mä:liki ýüwmid-di:n. 5. Iýýä:ke na\'büdü we iýýä:ke neste\'y:n.',
                    '6. Ihdinäs-syra:tal-müsteky:m. 7. Syra:tallezi:ne en\'amte aleýhim gaýril-magzu:bi aleýhim welezza:lli:n. (ämi:n)',
                ],
            },
            { type: 'subtitle', text: 'Bismillä:hir-rahmä:nir-rahy:m' },
            {
                type: 'verse_lines',
                lines: [
                    '1. Tebä:rakellezi: biýedihil-mülkü we hüwe alä: külli şey\'in kadi:r.',
                    '2. Ellezi: halekal-mewte wel-hayä:te liýeblüweküm eýýüküm ahsenü amelä:.. We hüwel-azi:zü\'l-gafu:r.',
                    '3. Ellezi: haleka seb\'a semä:wä:tin tybä:ka:. Ma: tera: fi: halkyrrahmä:ni min tefä:wüt. Ferji\'yl-basara hel tera: min fütü:r.',
                    '4. Sümmerji\'yl-basara kerrateýni ýenkalib ileýkel-basaru ha:si\'ew-we hüwe hasi:r.',
                    '5. We lekad zeýýennessema:\'ed-düňýä: bimesa:bi:ha we je\'alnä:hä: rujumel-lişşeýä:ty:ni we a\'tednä: lehum azabes-se\'y:r.',
                    '6. We lillezi:ne keferu: birabbihim aza:bü jehenneme we bi\'sel-masy:r.',
                    '7. Iza: ülku: fi:hä: semi\'u: lehä: şehi:kaw-we hiýe tefu:r.',
                    '8. Tekä:dü temäýýeziü minel-gaýz. Küllemä: ülkyýe fi:hä: fewjun se\'elehum hazenetühä: elem ye\'tiküm nezi:r.',
                    '9. Ka:lu: belä: kad ja:\'enä: nezi:run fekezzebnä: we kulnä: mä: nezzelella:hu min şey\'in in entüm illä: fi: zalä:lin kebi:r.',
                    '10. We ka:lu: lew künnä: nesme\'u ew na\'kylü mä: künnä: fi: asha:bis-sa\'y:r.',
                    '11. Fa\'terafu: bizembihim fesuhkal-li\'asha:bis-se\'y:r.',
                    '12. Innellezi:ne ýahşewne rabbehüm bil-gaýbi lehum magfiratüw-we ejrun kebi:r.',
                    '13. We esirru: kawleküm ewijheru: bih. Innehü: ali:müm bizä:tissudu:r.',
                    '14. Elä: ýa\'lemu men halak. We hüwel-lati:fül-habi:r.',
                    '15. Hüwellezi: je\'ale lekümul-arza zelü:lan femşu: fi: menä:kibi hä: we külü: mir-rizkyh. We ileýhin-nüşu:r.',
                    '16. E emintüm men fissemä:\'i eý-ýahsife bikümül-arza fe izä: hiýe temu:r.',
                    '17. Em emintüm men fissemä:\'i eý-ýursile aleýküm ha:sybä:. Feseta\'lemu:ne keýfe nezi:r.',
                    '18. Welekad kezzebellezi:ne min kablihim fekeýfe kä:ne neki:r.',
                ],
            },
        ],
    },
    {
        id: 'yaslarda_we_towirlerde_okalyan_esasy',
        title: 'Ýaslarda we töwirlerde okalýan esasy süreler we aýatlar',
        blocks: [
            { type: 'sectionTitle', text: '«Fatyha» süresi' },
            {
                type: 'verse_lines',
                lines: [
                    '1. Bismillä:hir-rahmä:nir-rahy:m',
                    '2. Elhamdü lilla:hi rabbil-a:lemi:n. 3. Er-rahmä:nir-rahy:m.',
                    '4. Mä:liki ýüwmid-di:n. 5. Iýýä:ke na\'büdü we iýýä:ke neste\'y:n.',
                    '6. Ihdinäs-syra:tal-müsteky:m. 7. Syra:tallezi:ne en\'amte aleýhim gaýril-magzu:bi aleýhim welezza:lli:n.',
                ],
            },
            { type: 'sectionTitle', text: '«Bakara» süresiniň 1-5 aýatlary' },
            { type: 'subtitle', text: 'Bismillä:hir-rahmä:nir-rahy:m' },
            {
                type: 'verse_lines',
                lines: [
                    '1. Elif Lä:m-Mi:m.',
                    '2. Zä:likel-kitä:bü lä: raýbe fi:h. Hüdäl-lil-müttekyn.',
                    '3. Ellezi:ne ýü\'minu:ne bil-gaýbi we ýüky:mu:nes-salä:te we mimmä: razeknä:hum ýünfiku:n.',
                    '4. Wellezi:ne ýü\'minu:ne bimä: ünzile ileýke wemä: ünzile min kablik. We bil-a:hyrati hüm ýü:kinu:n.',
                    '5. Ülä:\'ike alä: hüdem-mir-rabbihim we ülä:\'ike hümül-müflihu:n.',
                ],
            },
            { type: 'sectionTitle', text: '«Bakara» süresiniň 152-157 aýatlary' },
            { type: 'subtitle', text: 'Bismillä:hir-rahmä:nir-rahy:m' },
            {
                type: 'verse_lines',
                lines: [
                    '152. Fezküru:ni: ezkürküm weşküru:li: welä: tekfüru:n.',
                    '153. Ýä: eýýühel-lezi:ne ä:menuste\'y:nu: bis-sabri wes-salä:h. Innalla:he ma\'as-sa:biri:n.',
                    '154. Welä: teku:lu: limeý-ýuktelu fi: sebi:lillä:hi emwä:t. Bel ahýä:\'üw-we lä:kinlä: teş\'uru:n.',
                    '155. Weleneblüwennneküm bişey\'im-minel-hawfi wel-ju:\'y we naksym-minel-emwä:li wel-enfüsi wes-semerä:t. We beşşiris-sa:biri:n.',
                    '156. Ellezi:ne izä: esa:bet-hüm-müsy:betün ka:lu: innä: lilla:hi we innä: ileýhi ra:ji\'u:n.',
                    '157. Ülä:\'ike aleýhim salewä:tüm-mir-rabbihim we rahmetüw-we ülä:\'ike hümül-mühtedu:n.',
                ],
            },
        ],
    },
    {
        id: 'bakara_255_285_286_ali_imran_190_194',
        title: 'Aýatlar',
        blocks: [
            { type: 'sectionTitle', text: '«Bakara» süresiniň 255 aýaty (Ayátül-kürsi)' },
            { type: 'subtitle', text: 'Bismillä:hir-rahmä:nir-rahy:m' },
            {
                type: 'verse_lines',
                lines: [
                    '255. Alla:hu lä: ilä:he illä:hü:. El-haýýül-kaýýu:m. Lä: te\'huzu:hu sinetüw-welä: newm. Lehu mä: fis-semä:wä:ti wemä: fil-arz. Men zellezi: ýeşfe\'u yndehu illä: bi iznih. Ýa\'lemu mä: beýne eýdi:him wemä: halfehum welä: ýuhy:tu:ne bişeý\'im-min ylmihi: illä: bimä:şä:\'. Wesi\'a kürsiýýühüs-semä:wä:ti wel-arz. Welä: ýe\'üduhu: hyfzuhümä:. We hüwel-aliýýül-azy:m.',
                ],
            },
            { type: 'sectionTitle', text: '«Bakara» süresiniň 285-286 aýatlary' },
            { type: 'subtitle', text: 'Bismillä:hir-rahmä:nir-rahy:m' },
            {
                type: 'verse_lines',
                lines: [
                    '285. Ä:menerrasu:lü bimä: ünzile ileýhi mir-rabbihi: wel-mü\'minu:n. Küllün ä:mene billa:hi we melä:\'iketihi: we kütübihi: we rusülih. Lä: nüferriku beýne ahadim-mir-rusulih. We ka:lu: semi\'nä: we etä\'nä: gufra:neke rabbenä: we ileýkel mesy:r.',
                    '286. Lä: ýükellifulla:hu nefsen illä: wüs\'ä:hä:. Lehæ: mä: kesebet we aleýhä: mektesebet. Rabbenä: lä: tü\'ä:hyznä: in-nesi:nä: ew ahta\'nä:. Rabbenä: welä: tahmil aleýnâ: isran kemä: hameltehü: alellezi:ne min kablinä:. Rabbenä: welä: tühammi l-nä: mä: lä: ta:katelenä: bih. Wa\'fu annä: wagfirlenä: werhamnä: ente mewlänâ: fensurnä: alel-kawmil-kä:firi:n.',
                ],
            },
            { type: 'sectionTitle', text: '«Alü Ymran» süresiniň 190-194 aýatlary' },
            { type: 'subtitle', text: 'Bismillä:hir-rahmä:nir-rahy:m' },
            {
                type: 'verse_lines',
                lines: [
                    '190. Inne fi: halkyssemä:wä:ti wel-arzy wehtilä:fil-leýli wen-nehä:ri le\'ä:ýä:til-li\'ülil-elbä:b.',
                    '191. Ellezi:ne ýüżkuru:nella:he kyýä:mew-we ku\'u:dew-we alä: junu:bihim we ýetefekkeru:ne fi: halkys-semä:wä:ti wel-arz. Rabbenä: mä: halekte hä:zä: bä:tylen Sübha:neke fakynä: aza:ben-nä:r.',
                    '192. Rabbenä: inneke men tüdhylin-nä:ra fekad ahzeýteh. Wemä: liz-za:limi:ne min ansa:r.',
                    '193. Rabbenä: innenä: semi\'nä: münä:diýýeý-ýunä:di li\'l-i:mä:ni en ä:minu: birabbiküm fe ä:mennä:. Rabbenä: fagfirlenä: zünu:benä: we keffir annä: seýýi\'ä:tinä: we teweffenä: ma\'al-ebra:r.',
                    '194. Rabbenä: we ä:tinä: mä: wa\'adtenä: alä: rusülike welä: tuhzinä: ýewmel-kyýä:meh. Inneke lä: tühliful-mi:\'a:d.',
                ],
            },
        ],
    },
    {
        id: 'feth_27_29_hasr_20_24_nebe',
        title: 'Süre/Aýat Toplumy',
        blocks: [
            { type: 'sectionTitle', text: '«Fetih» süresiniň 27-29 aýatlary' },
            { type: 'subtitle', text: 'Bismillä:hir-rahmä:nir-rahy:m' },
            {
                type: 'verse_lines',
                lines: [
                    '27. Lekad sadekalla:hu rasu:lehur-ru\'ýä: bil-hakk. Leted-hulünnel-mesjidəl-hara:me inşä:\'allahu ä:mini:ne muhalli:ky:ne ru\'u:seküm we mukassyri:ne lä: teha:fu:n. Fe alime mä: lem ta\'lemu: feje\'ale min du:ni zä:like fethan kari:ba:.',
                    '28. Hüwellezi: ersele rasu:lehu: bil-hüdä: we di:nil-hakky liýuzhirahu aled-di:ni küllih. We kefä: billa:hi şehi:dä:.',
                    '29. Muhammedur-rasu:lulla:h. Wellezi:ne me\'ahu: eşiddä:\'ü alel-küffä:ri ruhamä:\'ü beýnehüm tera:hüm rukke\'an süjjedäý-yebtegu:ne fazläm-minella:hi we rizwä:nä:. Si:mä:hüm fi: wüju:hihim-min eseris-süju:d. Zä:like meselühüm fit-tewra:ti we meselühüm fil-inji:l.',
                ],
            },
            { type: 'sectionTitle', text: '«Haşr» süresiniň 20-24 aýatlary' },
            { type: 'subtitle', text: 'Bismillä:hir-rahmä:nir-rahy:m' },
            {
                type: 'verse_lines',
                lines: [
                    '20. Lä: ýestewi: esha:bünnä:ri we esha:bül-jenneh. Esha:bül-jenneh hümü\'l-fa:\'izu:n.',
                    '21. Lew enzelnä: hä:zel-kur\'ä:ne alä: jebelin lera\'eýtehü: ha:şi\'an-mütesaddi\'an-min haşyetillä:h. We tilkel-emsä:lü nazribühä: lin-nä:si le\'allehüm ýetefekkeru:n.',
                    '22. Hüwallä:hüllezi: lä: ilä:he illä:hü:. Ä:limül-gaýbi weş-şeha:deti hüwer-rahmä:nürrahym.',
                    '23. Hüwallä:hüllezi: lä: ilä:he illä:hu:. El-melikül-kuddüsüs-selä:mül-mü\'minül-mühäýminül-azi:zül-jebbä:rul-mütekebbir. Sübha:nella:hi ammää: ýüşriku:n.',
                    '24. Hüwallä:hül-ha:likul-bä:ri\'ül-musa:wwiru lehu\'l-esmä:\'ül-husnä:. Ýüsebbi hu lehu: mä: fis-semä:wä:ti wel-arz. We hüwel-azi:zül-haki:m.',
                ],
            },
            { type: 'sectionTitle', text: '«Nebe» süresi' },
            { type: 'subtitle', text: 'Bismillä:hir-rahmä:nir-rahy:m' },
            {
                type: 'verse_lines',
                lines: [
                    '1. Amme ýetesa:\'elu:n. 2. Anin-nebe\'il-azy:m 3. Ellezi: hüm fi:hi mühtelifu:n 4. Kellä: seýa\'lemu:n. 5. Sümme kel-',
                ],
            },
        ],
    },
    {
        id: 'taryk_ala_gasiye_fejr',
        title: 'Süreler',
        blocks: [
            { type: 'sectionTitle', text: '«Taryk» süresi' },
            { type: 'subtitle', text: 'Bismillä:hir-rahmä:nir-rahy:m' },
            {
                type: 'verse_lines',
                lines: [
                    '1. Wes-semã:\'i wet-ta:ryk. 2. Wemä: edra: kemet-ta:ryk.',
                    '3. En-nejmüs-sa:kyb. 4. In küllü nefsil-lemmä: aleýhä: ha:fyz.',
                    '5. Fel-ýenzuril-insä:nü mimme hulik. 6. Hulika mim-mä:\'in dä:fik.',
                    '7. Ýahruju mim-beýnis-sulbi wet-tera:\'ib. 8. Innehü: alä: raj\'yhi: leka:dir.',
                    '9. Ýewme tübles-sera:\'ir. 10. Femä: lehü: min kuwwetiw-welä: nä:syr.',
                    '11. Wes-semã:\'i zã:tir-raj\'y 12. wel-arzy zã:tis-sad\'y 13. innehü: lekawlun fasl. 14. Wemä: hüwe bil-hezl.',
                    '15. Innehüm ýeki:du:ne keýdä:. 16. We eki:du keýdä:.',
                    '17. Femeh-hilil-kä:firi:ne emhilhüm ruweýdä:.',
                ],
            },
            { type: 'sectionTitle', text: '«A\'la» süresi' },
            { type: 'subtitle', text: 'Bismillä:hir-rahmä:nir-rahy:m' },
            {
                type: 'verse_lines',
                lines: [
                    '1. Sebbihysme rabbikel-a\'lã:. 2. Ellezi: haleka fesewwä:.',
                    '3. Wellezi: kaddera fehedä:. 4. Wellezi: ahrajel-mer\'ã:.',
                    '5. Feje\'alehü: gusa:\'en ahwã:. 6. Senukri\'üke felä: tensã:.',
                    '7. Illä: mä:şã:\'alla:h. Innehü: ya\'lemül-jehra wemä: yahfã:.',
                    '8. We nüýessiruke lil-ýüsrä:. 9. Fezekkir in-nefe\'atiz-zikrã:.',
                    '10. Seýezzekkeru meý-yahşã:. 11. We ýetejennebühäl-eşkã:.',
                    '12. Ellezi: yaslen-nä:ral-kübrã:. 13. Sümme lä: ýemü:tü fi:hä: welä: ýahyã:.',
                    '14. Kad eflaha men tezekkä:. 15. We zekerasme rabbihi: fesallä:.',
                ],
            },
            { type: 'sectionTitle', text: '«Gaşiyä» süresi' },
            { type: 'subtitle', text: 'Bismillä:hir-rahmä:nir-rahy:m' },
            {
                type: 'verse_lines',
                lines: [
                    '1. Hel etä:ke hadi:sül-ga:şiyéh.',
                    '2. Wüju:hüý-ýewme\'izin ha:şi\'ah.',
                    '3. A:miletün-na:sybeh. 4. Teslä: nä:ran ha:míýeh.',
                    '5. Tüskä: min aýn in a:níýeh. 6. Leýse lehum ta\'a:mün illä: min zari:\'.',
                    '7. Lä: ýüsmünu welä: ýügni: min ju:\'.',
                    '8. Wüju:hüý-ýewme\'izin-nä:\'ymeh. 9. Lisaý\'hä: ra:zyýeһ.',
                    '10. Fi: jennetin a:liýeh. 11. Lä: tesme\'u fi:hä: lä:gýýeh.',
                    '12. Fi:hä: aýnün jä:riýeh. 13. Fi:hä: sürürum-merfu\'ah.',
                    '14. We ekwä:büm-mewzu:\'ah. 15. We nemä:rikü masfu:feh.',
                    '16. We zera:biýýü mebsü:seh. 17. Efelä: ýenzuru:ne ilel-ibili keýfe hulikat.',
                    '18. We iles-semã:\'i keýfe rufi\'at. 19. We ilel-jibä:li keýfe nusybet.',
                    '20. We ilel-arzy keýfe sütyhat. 21. Fezekkir innemä: ente müzekkir.',
                    '22. Leste aleýhim bimuṣayṭyr. 23. Illä: men tewellä: we kefer.',
                    '24. Feýu\'azzibühulla:hül-aza:bel-ekber. 25. Inne ileýnã: iýä:beһüm.',
                    '26. Sümme inne aleýnã: hysä:beһüm.',
                ],
            },
            { type: 'sectionTitle', text: '«Fejr» süresi' },
            { type: 'subtitle', text: 'Bismillä:hir-rahmä:nir-rahy:m' },
            {
                type: 'verse_lines',
                lines: [
                    '1. Wel-fejr. 2. We leýä:lin aşr. 3. Weş-şef\'y wel-wetr.',
                    '4. Wel-leýli izä: ýesr. 5. Hel fi: zä:like kasemüil-lizi: hyjr.',
                    '6. Elem tera keýfe fa\'ale rabbüke bi a:d. 7. Irame zä:til-ymä:d.',
                    '8. Elleti: lem ýuhlak mislühä: fil-bilä:d. 9. We semü:dellezi:ne jä:büṣ-sahra bil-wä:d.',
                    '10. We fir\'awne zil-ewtä:d. 11. Ellezi:ne tegaw fi-l-bilä:d. 12. Fe ekseru: fi:häl-fesä:d.',
                    '13. Fesabbe aleýhim rabbüke sewta azä:b. 14. Inne rabbeke lebil-mirṣa:d.',
                    '15. Fe emmel-insä:nü izä: mebtelähü rabbühu: fe ekramehü: we na\'amehü: feýeku:lü rabbii ekramen.',
                    '16. We emmã: izä: mebtelähü: fekadera aleýhi rizkahu: feýeku:lü rabbii ehä:nen.',
                    '17. Kellä: bel-lä: tükrimu:nel-ýeti:m. 18. Welä: teha:zzü:ne alä: ta\'a:mil-miski:n.',
                    '19. We te\'külu:net-türä:se eklel-lemma:. 20. We tühibbü:nel-mä:le hubbän jemmã:.',
                ],
            },
        ],
    },
    {
        id: `buruj_etc`,
        title: `«Büruj» süresi we saýlananlar`,
        blocks: [
            { type: `heading`, text: `«Büruj» süresi` },
            { type: `subtitle`, text: `Bismillä:hir-rahmä:nir-rahy:m` },
            { type: `text`, text: `1. Wes-semā:'i zä:til-büru:j. 2. Wel-ýewmil-mew'u:d. 3. We şā:hidıw-we meşhü:d. 4. Kutile asha:bül-ühdü:d. 5. En-nä:ri zä:til-weku:d. 6. Iz hüm aleyhä: ku'u:d. 7. We hüm alä: mä: ýef'alu:ne bil-mu'mini:ne şühü:d. 8. Wemä: nekamu: min-hüm illä: eý-ýu'minu: billä:hil-azi:zil-hami:d.` },
        ],
    },
    {
        id: `leyl_zuha_insirah_tin`,
        title: `«Leýl», «Zuha», «Inşirah», «Tin» süreleri`,
        blocks: [
            { type: `heading`, text: `«Leýl» süresi` },
            { type: `subtitle`, text: `Bismillä:hir-rahmä:nir-rahy:m` },
            { type: `text`, text: `1. Welleýli izä: ýagşä:. 2. Wen-nehä:ri izä: tejellā:. 3. Wemä: halekaz-zekera wel-ünsä:. 4. Inne sa'yeküm leşettä:. 5. Fe emmā: men a'tā: wettekā:. 6. We saddeka bil-husnä:. 7. Fesenüýessiruhü lil-ýüsrä:. 8. We emmā: men behyle westagnā:. 9. We kezzebe bil-husnä:. 10. Fesenüýessiruhü lil-usrā:. 11. Wemä: ýugni: anhü mä:lühü: izä: teraddä:. 12. Inne aleýnā: lel-hüdä:. 13. We inne lenā: lel-ä:hy:rate wel-ü:lä:. 14. Fe enzertüküm nä:ran telezzā:. 15. Lä: ýaslä:hā: illel-eşkā:. 16. Ellezi: kezzebe we tewellā:. 17. We seýüjennebühäl-etkā:. 18. Ellezi: ýu'ti: mä:lehü: ýetezekkā:. 19. Wemä: li ahadin yndehu: min-ni'metin tüjzā:. 20. Illabtiġā:'e wejhi rabbihil-a'lä:. 21. Welesewefe ýerzā:.` },
            { type: `heading`, text: `«Zuha» süresi` },
            { type: `subtitle`, text: `Bismillä:hir-rahmä:nir-rahy:m` },
            { type: `text`, text: `1. Wez-zuha:. 2. Wel-leýli izä: sejā:. 3. Mä: wedde'ake rabbüke wemä: kalā:. 4. Welel-ä:hy:ratü hayrul-leke minel-ü:lä:. 5. Welesewefe ýu'ty:ke rabbüke feterzā:. 6. Elem ýejidke ýeti:men fe ä:wā:. 7. We wejedeke za:llen fehedā:. 8. We wejedeke a:ilen fe egnā:. 9. Fe emmel-ýeti:me felä: tekhar. 10. We emmes-sä:'ile felä: tenhär. 11. We emmā: bi ni'meti rabbike fehaddis.` },
            { type: `heading`, text: `«Inşirah» süresi` },
            { type: `subtitle`, text: `Bismillä:hir-rahmä:nir-rahy:m` },
            { type: `text`, text: `1. Elem neşrah leke sadrak. 2. We weza'nä: anke wizrak. 3. Ellezi: enkaza zahrak. 4. We refe'nä: leke zikrak. 5. Fe inne me'al-usri ýusrä:. 6. Inne me'al-usri ýusrä:. 7. Fe izä: ferağte fensab. 8. We ilā: rabbike ferhab.` },
            { type: `heading`, text: `«Tin» süresi` },
            { type: `subtitle`, text: `Bismillä:hir-rahmä:nir-rahy:m` },
            { type: `text`, text: `1. Wet-ti:ni wez-zeýtu:n. 2. Wetu:ri si:ni:n. 3. We hä:zel-beledil-emi:n. 4. Lekad haleknel-insä:ne fi: ahseni takwi:m. 5. Sümme redednahü esfele sä:fili:n. 6. Illellezi:ne ä:menu: we amilus-sa:liha:ti fehum ejrun gaýru memnu:n. 7. Femä: ýükezzibüke ba'du bid-di:n. 8. Eleysa'lla:hu bi'ahkemil-hä:kimi:n.` },
        ],
    },
    {
        id: `alak_kadr_beyyine`,
        title: `«Alak», «Kadr», «Beýýine» süreleri`,
        blocks: [
            { type: `heading`, text: `«Alak» süresi` },
            { type: `subtitle`, text: `Bismillä:hir-rahmä:nir-rahy:m` },
            { type: `text`, text: `1. Ikra' bismi rabbikellezi: halak. 2. Halekal-insä:ne min alak. 3. Ikra' we rabbükel-ekram. 4. Ellezi: alleme bil-kalem. 5. Allemel-insä:ne mä:lem ýa'lem. 6. Kellä: innel-insä:ne leýatgā:. 7. Errä:'ähüstagnā:. 8. Inne ilā: rabbiker-ruj'ā:. 9. Era'eytellezi: ýenhä:. 10. Abden izä: sallā:. 11. Era'eyte in kä:ne alel-hüdä:. 12. Ew emera bit-takwä:. 13. Era'eyte in kezzebe we tewellä:. 14. Elem ýa'lem bi ennalla:he ýerä:. 15. Kellā: le'il-lem ýentehi lenesfe'am bin-nä:syýe. 16. Nä:syýetin kä:zibetin haty'eh. 17. Felýed'ü nä:diýeh. 18. Seneri'uz-zebä:niýe. 19. Kellā:. Lä: tuty'hü wesjud waktarib.` },
            { type: `heading`, text: `«Kadr» süresi` },
            { type: `subtitle`, text: `Bismillä:hir-rahmä:nir-rahy:m` },
            { type: `text`, text: `1. Innä: enzelnä:hü fi: leýletil-kadr. 2. Wemä: edra:ke mä: leýletül-kadr. 3. Leýletül-kadri hayrum min elfi şehr. 4. Tenezzelül-melä:'iketü wer-ru:hu fi:hä: bi izni rabbihim min külli emr. 5. Selä:mün hiýe hattā: metle'yl-fejr.` },
            { type: `heading`, text: `«Beýýine» süresi` },
            { type: `subtitle`, text: `Bismillä:hir-rahmä:nir-rahy:m` },
            { type: `text`, text: `1. Lem ýekünillezi:ne keferu: min ehlil-kitä:bi wel-muşriki:ne münfekki:ne hattā: te'tiýehümül-beýýineh. 2. Rasu:lüm minalla:hi ýetlu: suhu:fem mutahherah. 3. Fi:hä: kütübün kaýýimeh. 4. We mä: teferraķellezi:ne ü:til-kitä:be illä: mim ba'di mä: jä:'ethümül-beýýine. 5. We mä: ümiru: illä: liýa'budulla:he muhlisy:ne lehüd-di:ne hunefä:'e we ýuky:mus-salä:te we ýu'tuz-zekä:te we zä:like di:nül-kaýýimeh. 6. Innellezi:ne keferu: min ehlil-kitä:bi wel-muşriki:ne fi: nä:ri jä:henneme hä:lidi:ne fi:hä:. Ülä:'ike hüm şerrul-beriyýeh. 7. Innellezi:ne ä:menu: we amilus-sa:liha:ti ülä:'ike hüm haýrul-beriyýeh.` },
        ],
    },
    {
        id: `zilzal_adiyat_karia_tekasur`,
        title: `«Zilzal», «Adiyät», «Kari'a», «Tekasür» süreleri`,
        blocks: [
            { type: `heading`, text: `«Zilzal» süresi` },
            { type: `subtitle`, text: `Bismillä:hir-rahmä:nir-rahy:m` },
            { type: `text`, text: `1. Izä: zülziletil-arzu zilzä:lehä:. 2. We ahrajetil-arzu eska:lehä:. 3. We ka:lel-insä:nü mä: lehä:. 4. Ýewme'izin tühaddisü ahbä:rahä:. 5. Bi'enne rabbeke ewha: lehä:. 6. Ýewme'iziý-ýasdürun-nä:sü eştä:tel-lýüräw a'mä:lehüm. 7. Femey-ýa'mel-miskä:le zerratin hayräý-ýerah. 8. We meý-ýa'mel-miskä:le zerratin şerräý-ýerah.` },
            { type: `heading`, text: `«Adiyät» süresi` },
            { type: `subtitle`, text: `Bismillä:hir-rahmä:nir-rahy:m` },
            { type: `text`, text: `1. Wel-a:diýä:ti zabhan. 2. Fel-mu:riýä:ti kadhan. 3. Fel-mugy:ra:ti subhan. 4. Fe eserne bihi nek'an. 5. Fewesatne bihi jem'an. 6. Innel-insä:ne lirabbihi: lekenu:d. 7. We innehu: alä: zä:like leşehi:d. 8. We innehu: lihubbil-haýri leşedi:d. 9. Efelä: ýa'lemu izä: bu'sira mä: fil-kubu:r. 10. We hussyle mä: fis-sudu:r. 11. Inne rabbehüm bihim ýewme'izin-lehabi:r.` },
            { type: `heading`, text: `«Kari'a» süresi` },
            { type: `subtitle`, text: `Bismillä:hir-rahmä:nir-rahy:m` },
            { type: `text`, text: `1. El-ka:ri'ätü. 2. Mel-ka:ri'ah. 3. Wemä: edra:ke mel-ka:ri'ah. 4. Ýewme ýeku:n-nä:sü kel-fera:şil-mebsu:s. 5. We teku:nül-jibä:lü kel-'yhnil-menfu:ş. 6. Fe emmā: men sekulet mewä:zi:nuh. 7. Fehüwe fi: 'yşetir-ra:zyýeh. 8. We emmā: men haffet mewä:zi:nuh. 9. Fe ümmühü: hä:wiýeh. 10. Wemä: edra:ke mä: hiýeh. 11. Nä:run hä:miýeh.` },
            { type: `heading`, text: `«Tekasür» süresi` },
            { type: `subtitle`, text: `Bismillä:hir-rahmä:nir-rahy:m` },
            { type: `text`, text: `1. Elhä:kümt-tekä:sur. 2. Hattä: zürtümül-meka:bir. 3. Kellä: sewfe ta'lemu:n. 4. Sümme kellä: sewfe ta'lemu:n. 5. Kellä: lew ta'lemu:ne 'ylmel-ýaky:n. 6. Leterewünnel-jahi:m. 7. Sümme leterewünnehä: 'aynel-ýaky:n. 8. Sümme letüs'elünne ýewme'izin anim-na'y:m.` },
        ],
    },
    {
        id: `asr_humeze_fil_kureys_maun`,
        title: `«Asr», «Hümeze», «Fil», «Kureýş», «Ma'un» süreleri`,
        blocks: [
            { type: `heading`, text: `«Asr» süresi` },
            { type: `subtitle`, text: `Bismillä:hir-rahmä:nir-rahy:m` },
            { type: `text`, text: `1. Wel-asr. 2. Innel-insä:ne lefi: husr. 3. Illellezi:ne ä:menü: we amilus-sa:liha:ti we tewä:saw bil-hakky we tewä:saw bis-sabr.` },
            { type: `heading`, text: `«Hümeze» süresi` },
            { type: `subtitle`, text: `Bismillä:hir-rahmä:nir-rahy:m` },
            { type: `text`, text: `1. Weýlül-likülli hümezeti-l-lümezeh. 2. Ellezi: jeme'a mä:lew-we addedeh. 3. Ýahsebü enne mä:lehü: ahledeh. 4. Kellä: leýümbezenenne fil-hutameh. 5. Wemä: edra:ke mel-hutameh. 6. Nä:rulla:hil-mu:kadeh. 7. Elleti: tettali'u alel-ef'ideh. 8. Innehä: aleyhim-mü'sadeh. 9. Fi: amedim-mümeddedeh.` },
            { type: `heading`, text: `«Fil» süresi` },
            { type: `subtitle`, text: `Bismillä:hir-rahmä:nir-rahy:m` },
            { type: `text`, text: `1. Elem tera keýfe fe'ale rabbüke bi'asha:bil-fi:l. 2. Elem ýej'al-keýdehüm fi: tazli:l. 3. We ersele aleyhim taýran ebä:bi:l. 4. Termi:him bihyja:ratim-min sijji:l. 5. Feje'alehüm ke'asfim-me'ku:l.` },
            { type: `heading`, text: `«Kureýş» süresi` },
            { type: `subtitle`, text: `Bismillä:hir-rahmä:nir-rahy:m` },
            { type: `text`, text: `1. Li i:lä:fi kuraýşin. 2. i:lä:fihim rihleteş-şitä:'i wessaýf. 3. Felýag'büdu: rabbe hä:zel-beýt. 4. Ellezi: et'amehüm min ju:'yw-we ä:menehüm min hawf.` },
            { type: `heading`, text: `«Ma'un» süresi` },
            { type: `subtitle`, text: `Bismillä:hir-rahmä:nir-rahy:m` },
            { type: `text`, text: `1. Era'eytellezi: ýükezzibü bid-di:n. 2. Fezä:likellezi: ýedu'u-l-ýeti:m. 3. Welä: ýahuzzu alä: ta'a:mil-miski:n. 4. Fewýlül-lil-müsalli:n. 5. Ellezi:ne hüm an salä:thim sä:hu:n. 6. Ellezi:ne hüm yürä:'u:n. 7. We ýemne'u:nel-mä:u:n.` },
        ],
    },
    {
        id: `kevser_kafirun_nasr_tebbet_yhlas_felak_nas`,
        title: `«Kewser» – «Nas» süreleri`,
        blocks: [
            { type: `heading`, text: `«Kewser» süresi` },
            { type: `subtitle`, text: `Bismillä:hir-rahmä:nir-rahy:m` },
            { type: `text`, text: `1. Innä: a'teýnä: kel-kewser. 2. Fesalli lirabbike wenhar. 3. Inne şā:ni'eke hüwel-ebter.` },
            { type: `heading`, text: `«Käfirun» süresi` },
            { type: `subtitle`, text: `Bismillä:hir-rahmä:nir-rahy:m` },
            { type: `text`, text: `1. Kul ýä: eýýühel-kä:firu:n. 2. Lä: a'büdu mä: ta'büdu:n. 3. Welä: entüm a:bidu:ne mä: a'büd. 4. Welä: ene a:bidüm mä: abettüm. 5. Welä: entüm a:bidu:ne mä: a'büdu. 6. Leküm di:niküm weliýe di:n.` },
            { type: `heading`, text: `«Nasr» süresi` },
            { type: `subtitle`, text: `Bismillä:hir-rahmä:nir-rahy:m` },
            { type: `text`, text: `1. Izä: jä:'e nasrulla:hi wel-feth. 2. We ra'eýten-nä:se ýedhulu:ne fi: di:nillä:hi efwä:jä:. 3. Fesebbih bihamdi rabbike westagfirhü innehu: kä:ne tewwä:ba:.` },
            { type: `heading`, text: `«Tebbet» süresi` },
            { type: `subtitle`, text: `Bismillä:hir-rahmä:nir-rahy:m` },
            { type: `text`, text: `1. Tebbet ýedä: ebi: lehebıw-we tebb. 2. Mä: agnä: anhü mä:lühü wemä: keseb. 3. Seýasla: nä:ran zä:te leheb. 4. Wemratetüh. Hammä:letel-hatab. 5. Fi: ji:dihä: hablüm-min mesed.` },
            { type: `heading`, text: `«Yhlas» süresi` },
            { type: `subtitle`, text: `Bismillä:hir-rahmä:nir-rahy:m` },
            { type: `text`, text: `1. Kul hüwalla:hu ehad. 2. Alla:hüs-samed. 3. Lem ýelid we lem ýu:led. 4. We lem ýekün lehü küfüwen ehad.` },
            { type: `heading`, text: `«Felak» süresi` },
            { type: `subtitle`, text: `Bismillä:hir-rahmä:nir-rahy:m` },
            { type: `text`, text: `1. Kul e'u:zu birabbil-felak. 2. Min şerri mä: halak. 3. We min şerri ga:sikin izä: wekab. 4. We min şerrin-neffä:sa:ti fil-ukad. 5. We min şerri hä:sidin izä: hasad.` },
            { type: `heading`, text: `«Nas» süresi` },
            { type: `subtitle`, text: `Bismillä:hir-rahmä:nir-rahy:m` },
            { type: `text`, text: `1. Kul e'u:zu birabbin-nä:s. 2. Melikin-nä:s. 3. Ilä:hin-nä:s. 4. Min şerril-weswä:sil-hannä:s. 5. Ellezi: ýüweswisu fi: sudu:rin-nä:s. 6. Minel-jinneti wen-nä:s.` },
        ],
    },
];
