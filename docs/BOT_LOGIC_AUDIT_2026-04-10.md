# Bot Oqimi Bo‘yicha Moderator Uchun Izoh

Bu hujjat bot qanday savollar berishini va user noto‘g‘ri joyga bosganda nima bo‘lishini oddiy tilda tushuntiradi.

Maqsad:

- moderator botda qaysi bosqichda nima kutishini tushunsin
- oldingi bosqichdagi tugma bosilganda nima ro‘y berishini bilsin
- hujjat so‘rash tartibi user tanloviga qarab qanday o‘zgarishini ko‘rsin

## Umumiy Tartib

Botda ro‘yxatdan o‘tish odatda quyidagi ketma-ketlikda ketadi:

1. Til tanlash
2. Telefon raqam
3. Asosiy menyu
4. Xizmat tanlash
5. Keyin tanlangan yo‘nalishga qarab savollar

Botning eng muhim xususiyati shuki, u hamma userga bir xil savol bermaydi. User avval nimani tanlasa, keyingi savollar ham shunga qarab o‘zgaradi.

## Ikki Asosiy Yo‘nalish

Botda ikki katta yo‘nalish bor:

- Doda kur’erlar uchun ro‘yxatdan o‘tish
- Yandex Lavka yoki Yandex Eda uchun ro‘yxatdan o‘tish

Har ikkala yo‘nalishda ham savollar userning tanloviga qarab o‘zgaradi.

## User Oldingi Tugmaga Bossа Nima Bo‘ladi

Bu eng muhim joy.

Oldingi bosqichdagi tugma hali chatda qolib ketsa, user uni qayta bosishi mumkin. Bunday holatda:

- ba’zan bot eski tanlovni qaytadan qabul qiladi
- ba’zan bot “bu tugma endi bu yerda ishlamaydi” mazmunidagi javob beradi
- ba’zan esa bot userni keyingi bosqichga qayta olib borishi mumkin

Shuning uchun moderator uchun asosiy qoida shuki:

- eski tugma bosilganini xato deb emas, “user chalkashib qolgan bo‘lishi mumkin” deb qabul qilish kerak
- userni oxirgi to‘g‘ri bosqichga qaytarish kerak
- bir xil ogohlantirishni qayta-qayta yuborib chatni to‘ldirmaslik kerak

## Doda Yo‘nalishi

### Doda’da Avval Nimalar So‘raladi

Doda yo‘nalishida avval:

- qaysi xizmat tanlangani
- qaysi transport turi tanlangani
- qaysi shahar
- qaysi davlat fuqarosi ekani

Shundan keyin hujjatlar so‘raladi.

### Doda’da Hujjatlar Nima Uchun O‘zgaradi

Bu yo‘nalishda hamma userdan bir xil hujjat so‘ralmaydi. Masalan:

- yengil mashina tanlansa, bir xil hujjatlar so‘raladi
- yuk mashinasi tanlansa, qo‘shimcha ma’lumotlar ham kerak bo‘ladi
- moto yoki piyoda tanlansa, hujjatlar boshqa bo‘ladi

User qaysi davlatdan kelganiga qarab ham savollar o‘zgaradi. Ayrim fuqaroliklar uchun qo‘shimcha hujjatlar yoki tasdiqlar kerak bo‘ladi.

### Doda’da Eski Tugma Bosilsa

Agar user oldingi bosqich tugmasini bossа:

- transport turi qayta tanlanishi mumkin
- shahar qayta so‘ralishi mumkin
- fuqarolik qayta o‘zgarishi mumkin
- oldingi hujjatlar bekor bo‘lib, yangidan boshlanishi mumkin

Bu joyda moderator uchun muhim narsa:

- userning tanlovi o‘zgarsa, undan keyingi savollar ham o‘zgaradi
- bu xato emas, botning tabiiy ishlash tartibi

## Yandex Lavka / Yandex Eda Yo‘nalishi

Bu yo‘nalishda savollar Doda’dan ham ko‘proq user tanloviga bog‘liq.

Avval quyidagilar aniqlanadi:

- qaysi shahar
- qaysi davlat fuqarosi
- agar kerak bo‘lsa, qaysi hujjat turi
- agar kerak bo‘lsa, qaysi viza turi

### Mamlakat Bo‘yicha Farq

#### O‘zbekiston yoki Tojikiston

Bu guruhda avval pasport, keyin hujjat turi so‘raladi. Hujjat turiga qarab keyingi savollar o‘zgaradi:

- patent bo‘lsa, bir yo‘l
- yashash huquqi bo‘lsa, boshqa yo‘l
- talaba bo‘lsa, yana boshqa yo‘l

#### Qozog‘iston yoki Qirg‘iziston

Bu guruhda pasport yoki ID turiga qarab savollar o‘zgaradi.

#### Rossiya fuqarosi

Bu yerda savollar qisqaroq bo‘ladi. Asosan pasport va keyingi tasdiqlar so‘raladi.

#### Turkmaniston

Bu eng sezgir yo‘nalishlardan biri.

Bu yerda:

- avval viza turi aniqlanadi
- keyin viza bilan bog‘liq hujjatlar so‘raladi
- keyin registratsiya yoki Amina kabi tasdiqlar so‘raladi

### Turkmaniston Bo‘yicha Muhim Nuqta

Turkmaniston yo‘nalishida viza turi noto‘g‘ri tanlansa, keyingi savollar ham o‘zgarib ketadi.

Shuning uchun moderator bunday holatda:

- userga oxirgi tanlovni qaytadan tekshirtirishi
- eski tugmalarni bosmaslikni eslatishi
- imkon bo‘lsa, bosqichni boshidan to‘g‘ri tanlov bilan davom ettirishi kerak

## Nima Qachon Xato Hisoblanadi

Quyidagi holatlar xato hisoblanadi:

- user savolga javob berish o‘rniga eski tugmani bossа
- user savol o‘rniga matn yuborib yuborsa, lekin tugma kerak bo‘lsa
- user hujjat o‘rniga noto‘g‘ri turdagi fayl yuborsa
- user bir bosqichni o‘tkazib yuborishga urinsa

Bu holatlarda bot odatda:

- qayta so‘raydi
- noto‘g‘ri javobni qabul qilmaydi
- userni to‘g‘ri bosqichga qaytaradi

## Moderator Uchun Amaliy Qoidalar

1. Userga eski tugmalar qolib ketgan bo‘lsa, ularni bosib ko‘rishi mumkinligini yodda tuting.
2. Agar user avvalgi tugmani bossа, bu ko‘pincha chalkashlikdan bo‘ladi, yomon niyat emas.
3. Userning tanlovi o‘zgarsa, undan keyingi hujjatlar ham o‘zgarishini unutmang.
4. Bir userga bir xil ogohlantirishni qayta-qayta yuborishdan saqlaning.
5. Eng to‘g‘ri yo‘l userni oxirgi aniq bosqichga qaytarishdir.

## Qisqa Xulosa

Botning logikasi oddiy ko‘rinadi, lekin aslida user tanloviga juda bog‘langan.

Asosiy xulosa:

- user nima tanlasa, keyingi savollar shunga qarab o‘zgaradi
- eski tugma bosilsa, bot adashishi mumkin, shuning uchun userni to‘g‘ri bosqichga qaytarish kerak
- hujjatlar mamlakat, fuqarolik, xizmat turi va transport turiga qarab farq qiladi

Moderator uchun eng muhim narsa:

- userni urish yoki tortish emas
- userni to‘g‘ri bosqichga qaytarish
- eski tugmalar bilan chalkashib ketgan joyni soddaroq tushuntirish
