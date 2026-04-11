# Moderator Qo'llanma: Kuryer Ro'yxatdan O'tkazish Boti

## Maqsad
Bu hujjat moderatorlar uchun. Unda bot qanday tartibda savol beradi, qaysi holatda qaysi hujjat so'raladi, va foydalanuvchi chalkashtirishga urinsa nima bo'lishi oddiy tilda tushuntirilgan.

## 1. Umumiy tartib
Foydalanuvchi ariza quyidagi ketma-ketlikda yuradi:

1. Til tanlaydi
2. Telefon raqami beradi
3. Servis tanlaydi
4. Bot xizmat turiga qarab savollar beradi
5. Hujjatlar to'ldirilgach yakuniy tekshiruv oynasi chiqadi
6. Foydalanuvchi "Yuborish" ni bosadi

Muhim qoida:

- Har bosqichda faqat shu bosqichga tegishli tugma yoki javob qabul qilinadi.
- Eski bosqich tugmasi bosilsa, bot arizani o'zgartirmaydi.
- Foydalanuvchi arizani "orqaga aylantirib yubora olmaydi".

## 2. Noto'g'ri harakatlar qanday boshqariladi
Quyidagi holatlar xato hisoblanadi:

- user savolga javob berish o'rniga eski tugmani bosadi
- user tugma kerak bo'lgan joyda oddiy matn yuboradi
- user hujjat o'rniga noto'g'ri turdagi fayl yuboradi
- user bosqichni o'tkazib yuborishga urinadi

Botning qoidasi:

- noto'g'ri javob ariza tartibini o'zgartirmaydi
- ariza faqat to'g'ri navbat bilan davom etadi
- oldingi tugmalar bilan keyingi bosqichni buzib bo'lmaydi

## 3. Doda yo'nalishi (asosiy mantiq)
Doda yo'nalishida avval quyidagilar olinadi:

1. Kategoriya (masalan: yengil, yuk, moto, velo, piyoda)
2. Shahar
3. Fuqarolik

Keyin hujjatlar kategoriya va fuqarolikka qarab o'zgaradi.

### 3.1 Yengil avtomobil
- Fuqarolik ayrim davlatlar bo'lsa, avval o'zini o'zi bandlik holati tekshiriladi
- Mashina RF ro'yxatida yoki yo'qligi so'raladi
- Shunga qarab hujjatlar turi o'zgaradi
- Yakunda pasportning 2 tomoni olinadi

### 3.2 Yuk mashinasi
- Yengil avtomobilga o'xshash
- Qo'shimcha ravishda: gabarit, yuk ko'tarish, brending savollari bor
- Yakunda pasportning 2 tomoni olinadi

### 3.3 Moto
- Kerakli shoxobchalar bo'yicha savollar
- Haydovchilik guvohnomasi
- Pasportning 2 tomoni

### 3.4 Velo / Piyoda
- Fuqarolik va bandlik holatiga qarab qo'shimcha savollar bo'lishi mumkin
- Yakunda pasportning 2 tomoni olinadi

## 4. Yandex yo'nalishi (Lavka va Eda)
Bu ikki servisda mantiq bir xil.

Tartib:

1. Shahar
2. Fuqarolik/status
3. Fuqarolikka qarab hujjatlar ketma-ketligi
4. Rekvizit bosqichlari
5. Yakuniy tekshiruv

Muhim:

- Turkmaniston bo'limida viza turiga qarab alohida shoxobcha ishlaydi
- O'zbekiston/TJ bo'limida tanlangan hujjat turiga qarab talablar o'zgaradi
- Har bir foydalanuvchiga bir xil emas, tanloviga qarab yo'l ajraladi

## 5. Moderator uchun amaliy qoida
Moderator quyidagiga qaraydi:

- foydalanuvchi ayni bosqichdagi savolga javob berganmi
- hujjat o'rniga boshqa media yubormaganmi
- eski tugma bosib yuborganmi
- yakuniy yuborishdan oldin kerakli hujjatlar to'liqmi

Agar foydalanuvchi "bot chalkashib ketdi" desa:

1. Oxirgi bot xabaridagi tugma/javob bo'yicha davom ettirishni ayting
2. Eski xabar tugmalarini bosmaslikni ayting
3. Zarurat bo'lsa /start dan toza boshlashni ayting

## 6. Natija
Botning ishlash tamoyili qat'iy:

- "to'g'ri bosqich -> to'g'ri javob -> keyingi bosqich"

Foydalanuvchi xohlasa ham eski tugmalar bilan ariza tartibini buzolmaydi.
