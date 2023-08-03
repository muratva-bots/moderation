import { IReason } from '@/models';

const ONE_MINUTE = 1000 * 60;
const ONE_DAY = ONE_MINUTE * 60 * 24;
const ONE_MONTH = ONE_DAY * 30;

export const DEFAULTS = {
    extraMuteTime: 300000,
    mute: {
        reasons: [
            {
                name: 'Küfür, hareket söylemi veya kışkırtmak',
                value: 'one',
                placeholder: 'Ceza süresi: 10 dakika',
                time: ONE_MINUTE * 10,
                needType: 0,
            },
            {
                name: 'Ailevi küfür, baslı içerik',
                value: 'two',
                placeholder: 'Ceza süresi: 15 dakika',
                time: ONE_MINUTE * 15,
                needType: 0,
            },
            {
                name: 'Kişisel sorunları yansıtma / Sunucu ismi verme',
                value: 'three',
                placeholder: 'Ceza süresi: 30 dakika',
                time: ONE_MINUTE * 30,
                needType: 0,
            },
            {
                name: 'Dini ve milli değerle dalga / Cinsellik',
                value: 'four',
                placeholder: 'Ceza süresi: 1 saat',
                time: ONE_MINUTE * 60,
                needType: 0,
            },
        ] as IReason[],
        limit: {
            count: 5,
            time: 900000,
        },
        max: [
            { count: 10, time: ONE_DAY, clear: 0 },
            { count: 15, time: ONE_DAY * 3, clear: 0 },
            { count: 20, time: ONE_DAY * 7, clear: 0 },
            { count: 25, time: ONE_DAY * 14, clear: true },
        ],
    },
    quarantine: {
        reasons: [
            {
                name: 'Sunucuyu kötüleme',
                value: 'one',
                placeholder: 'Ceza Süresi: 1 gün',
                time: ONE_DAY,
                needType: 0,
            },
            {
                name: 'Mikrofon-kulaklık hatasını kullanmak',
                value: 'two',
                placeholder: 'Ceza Süresi: 1 gün',
                time: ONE_DAY,
                needType: 0,
            },
            {
                name: 'Public odalara müzik botu çekmek',
                value: 'three',
                placeholder: 'Ceza Süresi: 1 gün',
                time: ONE_DAY,
                needType: 0,
            },
            {
                name: 'Stream ve Kamera odalarında fake kamera açmak',
                value: 'four',
                placeholder: 'Ceza Süresi: 1 gün',
                time: ONE_DAY,
                needType: 0,
            },
            {
                name: '3 Kez Gir Çık',
                value: 'five',
                placeholder: 'Ceza Süresi: 1 gün',
                time: ONE_DAY,
                needType: 0,
            },
            {
                name: 'Yayın ve Kamera Troll',
                value: 'six',
                placeholder: 'Ceza Süresi: 1 gün',
                time: ONE_DAY,
                needType: 0,
            },
            {
                name: 'Rahatsızlık vermek / Oda takibi',
                value: 'seven',
                placeholder: 'Ceza Süresi: 1 gün',
                time: ONE_DAY,
                needType: 0,
            },
            {
                name: 'Sorun Çözme Troll / Küfür',
                value: 'eight',
                placeholder: 'Ceza Süresi: 1 gün',
                time: ONE_DAY,
                needType: 0,
            },
            {
                name: 'Dini ve milli değerlere dalga geçmek',
                value: 'nine',
                placeholder: 'Ceza Süresi: 3 gün',
                time: ONE_DAY * 3,
                needType: 0,
            },
            {
                name: "Boost'u kötüye kullanma",
                value: 'ten',
                placeholder: 'Ceza Süresi: 3 gün',
                time: ONE_DAY * 3,
                needType: 0,
            },
            {
                name: 'Abartılı şekilde şiddet içerikli tehdit söylemi',
                value: 'eleven',
                placeholder: 'Ceza Süresi: 7 gün',
                time: ONE_DAY * 7,
                needType: 0,
            },
            {
                name: 'Ad Çıkarıcı Söylem',
                value: 'twelve',
                placeholder: 'Ceza Süresi: 7 gün',
                time: ONE_DAY * 7,
                needType: 0,
            },
            {
                name: 'Cinsel taciz',
                value: 'thirteen',
                placeholder: 'Ceza Süresi: 7 gün',
                time: ONE_DAY * 7,
                needType: 0,
            },
            {
                name: 'Dini ve milli değerlere küfür',
                value: 'fourteen',
                placeholder: 'Ceza Süresi: 7 gün',
                time: ONE_DAY * 7,
                needType: 0,
            },
            {
                name: 'Terör propagandası yapmak',
                value: 'fiveteen',
                placeholder: 'Ceza Süresi: 7 gün',
                time: ONE_DAY * 7,
                needType: 0,
            },
        ] as IReason[],
        limit: {
            count: 3,
            time: 900000,
        },
    },
    warn: {
        limit: {
            count: 3,
            time: 900000,
        },
    },
    underworld: {
        reasons: [
            {
                name: '15 yaş ve altı yaşa sahip olmak',
                value: 'one',
                placeholder: 'Ceza Süresi: 1 yıl',
                time: ONE_MONTH * 12,
                needType: 0,
            },
            {
                name: 'Dini milli değerlere küfür etmek',
                value: 'two',
                placeholder: 'Ceza Süresi: 1 ay',
                time: ONE_MONTH,
                needType: 0,
            },
            {
                name: 'Gereksiz yetki kullanımı',
                value: 'three',
                placeholder: 'Ceza Süresi: 2 ay',
                time: ONE_MONTH * 2,
                needType: 0,
            },
            {
                name: 'Sahte görüntü veya yan hesap bulundurma',
                value: 'four',
                placeholder: 'Ceza Süresi: 3 ay',
                time: ONE_MONTH * 3,
                needType: 0,
            },
            {
                name: 'İfşa / Taciz / Tehdit',
                value: 'five',
                placeholder: 'Ceza Süresi: 1 yıl',
                time: ONE_MONTH * 12,
                needType: 0,
            },
            {
                name: 'Kişisel bilgi ve +18 paylaşım',
                value: 'six',
                placeholder: 'Ceza Süresi: 1 yıl',
                time: ONE_MONTH * 12,
                needType: 0,
            },
        ] as IReason[],
        limit: {
            count: 5,
            time: 900000,
        },
    },
    unregistered: {
        limit: {
            count: 5,
            time: 900000,
        },
    },
    booster: {
        limit: {
            count: 5,
            time: 900000,
        },
    },
};
