export const SETTINGS = {
    general: [
        {
            name: 'AFK Odası',
            value: 'afkRoom',
            description: 'AFK odasını belirlersiniz.',
            type: 'channel',
            isParent: false,
            isVoice: true,
        },
        {
            name: 'Chat Kanalı',
            value: 'chatChannel',
            description: 'Chat kanalını belirlersiniz.',
            type: 'channel',
            isParent: false,
            isVoice: false,
        },
        {
            name: 'Register Kanalı',
            value: 'registerChannel',
            description: 'Register kanalını belirlersiniz.',
            type: 'channel',
            isParent: false,
            isVoice: false,
        },
        { name: 'İltifat', value: 'compliment', description: 'İltifat sistemini ayarlarsınız.', type: 'boolean' },
        { name: 'Oto Kayıt', value: 'autoRegister', description: 'Önceden kayıtlıysa kayıt edilir.', type: 'boolean' },
        {
            name: 'Tag/Taglar',
            value: 'tags',
            description: 'Sunucu tagını ayarlarsınız.',
            type: 'string',
            isMultiple: true,
            isNumber: false,
        },
        {
            name: 'Yasaklı Taglar',
            value: 'bannedTags',
            description: 'Sunucunun yasaklı taglarını ayarlarsınız.',
            type: 'string',
            isMultiple: true,
            isNumber: false,
        },
        {
            name: 'İkinci Tag',
            value: 'secondTag',
            description: 'Sunucu ikinci tagını ayarlarsınız.',
            type: 'string',
            isMultiple: false,
            isNumber: false,
        },
        {
            name: 'Taglı Rolü',
            value: 'familyRole',
            description: 'Sunucu taglı rolünü ayarlarsınız.',
            type: 'role',
            isMultiple: false,
        },
        {
            name: 'Yasaklı Tag Rolü',
            value: 'bannedTagRole',
            description: 'Yasaklı tag rolünü ayarlarsınız.',
            type: 'role',
            isMultiple: false,
        },
        {
            name: 'Vip Rolü',
            value: 'vipRole',
            description: 'Vip rolünü ayarlarsınız.',
            type: 'role',
            isMultiple: false,
        },
        {
            name: 'Public Kategorisi',
            value: 'publicParent',
            description: 'Public kategorisini ayarlarsınız.',
            type: 'channel',
            isParent: true,
            isVoice: false,
        },
        {
            name: 'Sorun Çözme Kategorisi',
            value: 'solvingParent',
            description: 'Sorun çözme kategorisini ayarlarsınız.',
            type: 'channel',
            isParent: true,
            isVoice: false,
        },
        {
            name: 'Sorun Çözme Log',
            value: 'solvingLog',
            description: 'Sorun çözme log kanalını ayarlarsınız.',
            type: 'channel',
            isParent: false,
            isVoice: false,
        },
        {
            name: 'Katıldı Rolü',
            value: 'meetingRole',
            description: 'Katıldı rolünü ayarlarsınız.',
            type: 'role',
            isMultiple: false,
        },
        {
            name: 'En Alt Yetkili Rolü',
            value: 'minStaffRole',
            description: 'En alt yetkili rollerini ayarlarsınız.',
            type: 'role',
            isMultiple: false,
        },
        {
            name: 'Rol Ekle Maksimum Rol',
            value: 'maxRoleAddRole',
            description: 'Rol ekle komutunda verilebilecek en üst rol.',
            type: 'role',
            isMultiple: false,
        },
        {
            name: 'Kurucu Rolleri',
            value: 'ownerRoles',
            description: 'Sunucu kurucu rollerini ayarlarsınız.',
            type: 'role',
            isMultiple: true,
        },
        {
            name: 'Taşıma Yetkili Rolü',
            value: 'moveAuth',
            description: 'Transport yetkili rolünü ayarlarsınız.',
            type: 'role',
            isMultiple: true,
        },
        {
            name: 'Sorun Çözücü Rolü',
            value: 'solvingAuth',
            description: 'Sorun çözücü rolünü ayarlarsınız.',
            type: 'role',
            isMultiple: false,
        },
        {
            name: 'Taglı Alım Modu',
            value: 'taggedMode',
            description: 'Taglı alım modunu ayarlarsınız.',
            type: 'boolean',
        },
        {
            name: 'Aylık Roller',
            value: 'monthlyRoles',
            description: 'Aylık rolleri ayarlarsınız.',
            type: 'monthly-roles',
        },

        {
            name: 'Aylık Üye Sistemi',
            value: 'monthlyRolesSystem',
            description: 'Aylık üye sistemini açarsınız.',
            type: 'boolean',
        },

        {
            name: 'İstila Koruması',
            value: 'invasionProtection',
            description: 'Sunucuya fake üye istilası olduğunda otorol sistemini kapatır.',
            type: 'boolean',
        },
        {
            name: 'Uyarı Rolleri',
            value: 'warnRoles',
            description: 'Uyarı rollerini belirtirsiniz.',
            type: 'warn-roles',
        },
        {
            name: 'Önceki Uyarı Rolünü Kaldırma',
            value: 'removeWarnRole',
            description: 'Kullanıcıya verilen yeni uyarı rolü varsa eski uyarı rolünü kaldırır.',
            type: 'boolean',
        },
        {
            name: 'Etkinlik Rolü',
            value: 'eventRoles',
            description: 'Etkinlik katılımcısı rolünü ayarlarsınız.',
            type: 'role',
            isMultiple: false,
        },
        {
            name: 'Çekiliş Rolü',
            value: 'giveawayRoles',
            description: 'Çekiliş katılımcısı rolünü ayarlarsınız.',
            type: 'role',
            isMultiple: false,
        },
        {
            name: 'İlişki Rolleri',
            value: 'loveRoles',
            description: 'İlişki rollerini ayarlarsınız.',
            type: 'role',
            isMultiple: true,
        },
        {
            name: 'Oyun Rolleri',
            value: 'gameRoles',
            description: 'Oyun rollerini ayarlarsınız.',
            type: 'role',
            isMultiple: true,
        },
        {
            name: 'Renk Rolleri',
            value: 'colorRoles',
            description: 'Renk rollerini ayarlarsınız.',
            type: 'role',
            isMultiple: true,
        },
        {
            name: 'Burç Rolleri',
            value: 'zodiacRoles',
            description: 'Burç rollerini ayarlarsınız.',
            type: 'role',
            isMultiple: true,
        },
    ],
    register: [
        {
            name: 'Register Yetkilisi',
            value: 'registerAuth',
            description: 'Kayıt yetkilisini ayarlarsınız.',
            type: 'role',
            isMultiple: true
        },
        {
            name: 'Erkek Rolleri',
            value: 'manRoles',
            description: 'Erkek rollerini belirtirsiniz.',
            type: 'role',
            isMultiple: true,
        },
        {
            name: 'Kadın Rolleri',
            value: 'womanRoles',
            description: 'Kadın rollerini belirtirsiniz.',
            type: 'role',
            isMultiple: true,
        },
        {
            name: 'Kayıtsız Rolleri',
            value: 'unregisterRoles',
            description: 'Kayıtsız rolü ve sunucuya giren kullanıcılara verilecek rol.',
            type: 'role',
            isMultiple: true,
        },
        {
            name: 'Genel Kayıt Rolü',
            value: 'registeredRole',
            description: 'Kayıt edilince herkese verilen rol.',
            type: 'role',
            isMultiple: false,
        },
        {
            name: 'Şüpheli Rolü',
            value: 'suspectedRole',
            description: 'Şüpheli rolünü belirtirsiniz.',
            type: 'role',
            isMultiple: false,
        },
        {
            name: 'Register Kategorisi',
            value: 'registerParent',
            description: 'Register kategorisini belirtirsiniz.',
            type: 'channel',
            isParent: true,
            isVoice: false,
        },
        {
            name: 'İsim Yaş',
            value: 'changeName',
            description: 'Kayıt edilince kullanıcının isminin değiştirilmesi.',
            type: 'boolean',
        },
        {
            name: 'Minimum Yaş',
            value: 'minAge',
            description: 'Sunucunun kayıt için gereken minumum yaş sınırı.',
            type: 'string',
            isNumber: true,
            isMultiple: false,
        },
        {
            name: 'Kayıt Sistemi Yaş Zorunluluğu',
            value: 'needAge',
            description: 'Sunucu kayıt için yaş zorunluluğu.',
            type: 'boolean',
        },
        {
            name: 'Kayıtsız Limiti',
            value: 'unregistered',
            description: 'Yetkililerin belirttiğiniz süre içinde atabileceği kayıtsız miktarı.',
            type: 'limit',
        },
        {
            name: 'Butonlu Kayıt',
            value: 'menuRegister',
            description: 'Kayıt sistemini butonlu olarak seçersiniz.',
            type: 'boolean',
        },
        {
            name: 'Kayıt Sistemi İsim Zorunluluğu',
            value: 'needName',
            description: 'Sunucu kayıt için isim zorunluluğu.',
            type: 'boolean',
        },
        {
            name: 'Register Sistemi',
            value: 'registerSystem',
            description: 'Register sistemini açar kapatırsınız.',
            type: 'boolean',
        },
    ],
    penal: [
        {
            name: 'Jail Yetkilisi',
            value: 'jailAuth',
            description: 'Jail yetkilisini ayarlarsınız.',
            type: 'role',
            isMultiple: true,
        },
        {
            name: 'Ban Yetkilisi',
            value: 'banAuth',
            description: 'Ban yetkilisini ayarlarsınız.',
            type: 'role',
            isMultiple: true,
        },
        {
            name: 'Voice Mute Yetkilisi',
            value: 'voiceMuteAuth',
            description: 'Voice mute yetkilisini ayarlarsınız.',
            type: 'role',
            isMultiple: true,
        },
        {
            name: 'Chat Mute Yetkilisi',
            value: 'chatMuteAuth',
            description: 'Chat mute yetkilisini ayarlarsınız.',
            type: 'role',
            isMultiple: true,
        },
        {
            name: 'Reklamcı Rolü',
            value: 'adsRole',
            description: 'Reklamcı rolünü ayarlarsınız.',
            type: 'role',
            isMultiple: false,
        },
        {
            name: 'Yazı Susturma Rolü',
            value: 'chatMuteRole',
            description: 'Chat susturma rolünü ayarlarsınız.',
            type: 'role',
            isMultiple: false,
        },
        {
            name: 'Karantina Rolü',
            value: 'quarantineRole',
            description: 'Karantina rolünü ayarlarsınız.',
            type: 'role',
            isMultiple: false,
        },
        {
            name: 'Underworld Rolü',
            value: 'underworldRole',
            description: 'Underworld rolünü ayarlarsınız.',
            type: 'role',
            isMultiple: false,
        },
        {
            name: 'Ses Susturma Rolü',
            value: 'voiceMuteRole',
            description: 'Ses susturma rolünü ayarlarsınız.',
            type: 'role',
            isMultiple: false,
        },
        {
            name: 'Ekstra Mute',
            value: 'extraMute',
            description: 'Kullanıcı bir günde birden fazla mute cezası alırsa extra mute yer.',
            type: 'boolean',
        },
        {
            name: 'Susturma Karantina',
            value: 'maxMuteOperations',
            description: 'Belirtilen susturma sayısına erişen kullanıcı ceza yer.',
            type: 'mute-operations',
        },
        {
            name: 'Ekstra Mute Süresi',
            value: 'extraMuteTime',
            description: '2 susturma cezası üzerine eklenecek ceza sayısına göre ekstra susturma.',
            type: 'number',
        },
        {
            name: 'Oto Ceza',
            value: 'maxMuteSystem',
            description: 'Kullanıcı belirtilen ceza sayısını aşarsa otomatik olarak karantinaya atılır.',
            type: 'boolean',
        },
        {
            name: 'Minimum Yaş Cezalı',
            value: 'minAgePunish',
            description: 'Kayıt edilen kullanıcı belirtilen minimum yaştan küçükse cezalıya atılır.',
            type: 'boolean',
        },
        {
            name: 'Chat Mute Limiti',
            value: 'mute',
            description: 'Yetkililerin belirtilen sürede kullanabileceği mute komutu miktarı.',
            type: 'limit',
        },
        {
            name: 'Karantina Limiti',
            value: 'quarantine',
            description: 'Yetkililerin belirtilen sürede kullanabileceği karantina komutu miktarı.',
            type: 'limit',
        },
        {
            name: 'Underworld Limiti',
            value: 'underworld',
            description: 'Yetkililerin belirtilen sürede kullanabileceği underworl komutu miktarı.',
            type: 'limit',
        },
        {
            name: 'Yazı Susturma (Özel Sebep)',
            value: 'chatMuteReasons',
            description: 'Yazı susturması menüsü için özel sebepler ayarlarsınız.',
            type: 'reason',
        },
        {
            name: 'Karantina (Özel Sebep)',
            value: 'quarantineReasons',
            description: 'Karantina menüsü için özel sebepler ayarlarsınız.',
            type: 'reason',
        },
        {
            name: 'Underworld (Özel Sebep)',
            value: 'underworldReasons',
            description: 'Underworld menüsü için özel sebepler ayarlarsınız.',
            type: 'reason',
        },
        {
            name: 'Sesli Susturma (Özel Sebep)',
            value: 'voiceMuteReasons',
            description: 'Sesli susturma menüsü için özel sebepler ayarlarsınız.',
            type: 'reason',
        },

    ],
};
