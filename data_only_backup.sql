COPY public."Style" (id, name, abbreviation, image_url, "createdAt", "updatedAt") FROM stdin;
cm2duk0zo00086y581yq5luh2	Teardrop	Tear	\N	2024-10-17 22:02:37.956	2024-10-17 22:01:04.028
\.
COPY public."Thread" (id, name, abbreviation, amann_number, isacord_number, "createdAt", "updatedAt") FROM stdin;
cm2dvxbki0000145djbebncw9	Dark Chocolate	DCS			2024-10-17 22:40:57.81	2024-10-17 22:38:04.874
cm2dvxbki0001145dj5azmbmp	Ivory	IS			2024-10-17 22:40:57.81	2024-10-17 22:38:05.372
cm2dvxbki0002145d6ugzphtp	Black	BS			2024-10-17 22:40:57.81	2024-10-17 22:38:05.856
cm2dvxbki0003145d6ns02rq9	Gold	GS			2024-10-17 22:40:57.81	2024-10-17 22:38:06.475
cm2dvxbki0004145drl0lylfj	Navy	NS			2024-10-17 22:40:57.81	2024-10-17 22:38:06.958
cm2dvxbki0005145d3phoi7xo	Burbon	BuS			2024-10-17 22:40:57.81	2024-10-17 22:38:07.442
cm2dvxbki0006145dt0o9ajvw	Hot Pink	HPS			2024-10-17 22:40:57.81	2024-10-17 22:38:07.942
cm2dvxbki0007145dm0cq0uhw	Crimson	CrS			2024-10-17 22:40:57.81	2024-10-17 22:38:08.41
cm2dvxbki0008145dt5iddlgw	Cinnamon	CiS			2024-10-17 22:40:57.81	2024-10-17 22:38:08.893
cm2dvxbki0009145db6zdbkac	Royal Blue	RBS			2024-10-17 22:40:57.81	2024-10-17 22:38:09.377
\.
COPY public."Shape" (id, name, "createdAt", "updatedAt", abbreviation) FROM stdin;
cm2duhfg000006y58dqulghkm	Driver	2024-10-17 22:00:36.721	2024-10-19 16:47:41.294	Driver
cm2duhfg300016y58sr14qoxd	3-Wood	2024-10-17 22:00:36.721	2024-10-19 16:47:41.294	3Wood
cm2duhfg300026y58r1rnkvbc	5-Wood	2024-10-17 22:00:36.721	2024-10-19 16:47:41.294	5Wood
cm2duhfg300036y583y11e4k3	7-Wood	2024-10-17 22:00:36.721	2024-10-19 16:47:41.294	7Wood
cm2duhfg300046y58o8dsmwzo	Fairway	2024-10-17 22:00:36.721	2024-10-19 16:47:41.294	Fairway
cm2duhfg300056y58ddfbtcxj	Hybrid	2024-10-17 22:00:36.721	2024-10-19 16:47:41.294	Hybrid
cm2duhfg300066y583ii779yr	Mallet	2024-10-17 22:00:36.721	2024-10-19 16:47:41.294	Mallet
cm2duhfg300076y585owscoo4	Blade	2024-10-17 22:00:36.721	2024-10-19 16:47:41.294	Blade
\.
COPY public."Collection" (id, title, handle, "createdAt", "updatedAt") FROM stdin;
297529147599	Home page	frontpage	2024-10-22 21:14:47.96	2024-10-22 21:14:47.96
297538945231	Animal Print	animal-print	2024-10-22 21:14:47.96	2024-10-22 21:14:47.96
297548677327	Argyle	argyle	2024-10-22 21:14:47.961	2024-10-22 21:14:47.961
297548611791	Classic	classic	2024-10-22 21:14:47.961	2024-10-22 21:14:47.961
297538977999	Quilted Classic	quilted-classic	2024-10-22 21:14:47.961	2024-10-22 21:14:47.961
297548710095	Quilted	quilted	2024-10-22 21:14:47.961	2024-10-22 21:14:47.961
\.
COPY public."ColorTag" (id, name, "createdAt", "updatedAt") FROM stdin;
cm2mblrjs0000rza90jsilvze	Brown	2024-10-23 20:22:01.913	2024-10-23 20:12:30.315
cm2mblrjt0001rza9che6immo	Black	2024-10-23 20:22:01.913	2024-10-23 20:12:30.514
cm2mblrjt0002rza9ygl9e1vs	Blue	2024-10-23 20:22:01.913	2024-10-23 20:12:30.679
cm2mblrju0003rza9kc0up31s	Green	2024-10-23 20:22:01.913	2024-10-23 20:12:58.886
cm2mblrju0004rza94514jymr	Grey	2024-10-23 20:22:01.913	2024-10-23 20:12:59.086
cm2mblrju0005rza9a52q3dxa	Purple	2024-10-23 20:22:01.913	2024-10-23 20:12:59.286
cm2mblrjv0006rza9taki52xq	Red	2024-10-23 20:22:01.913	2024-10-23 20:13:24.49
cm2mblrjv0007rza97rb4gbuh	Tan	2024-10-23 20:22:01.913	2024-10-23 20:13:30.797
cm2mblrjv0008rza9zrlar9ef	White	2024-10-23 20:22:01.913	2024-10-23 20:13:36.701
\.
COPY public."Font" (id, name, image_url, "createdAt", "updatedAt") FROM stdin;
cm2dw0v4h000b145d70dzv395	Gothic	https://drive.google.com/thumbnail?id=1SN3l-VTGEtTLdWUh5UWSoLdSJ5XEfsQa	2024-10-17 22:43:43.122	2024-10-17 23:30:56.271
cm2dw0v4h000a145doemuo7c1	Block	https://drive.google.com/thumbnail?id=1T7LRXF-pqm7Wg0PlD6C3lPrabQbegguL	2024-10-17 22:43:43.122	2024-10-17 23:35:23.129
cm2dw0v4h000c145dyla794mf	Los Angeles	https://drive.google.com/thumbnail?id=15hhiO0rMsExIACZYmEtvGz1n43mDNuzM	2024-10-17 22:43:43.122	2024-10-17 23:35:23.129
cm2dw0v4h000d145d7gnug20z	San Diego	https://drive.google.com/thumbnail?id=165en1xBa3Nei-_2BYr7CUv9RIM0ewlxm	2024-10-17 22:43:43.122	2024-10-17 23:35:23.129
cm2dw0v4h000e145d6aof3d2i	Serif	https://drive.google.com/thumbnail?id=1zCfxQzXeBb_gBNQhTaz3KoIlsJRugDg-	2024-10-17 22:43:43.122	2024-10-17 23:35:23.129
cm2dw0v4h000f145dz3h6i58o	Saipan	https://drive.google.com/thumbnail?id=1HkKc8sRiQef72wURoBHyW65NCE5Krs0V	2024-10-17 22:43:43.122	2024-10-17 23:35:23.129
cm2dw0v4h000g145d0v6tpp72	Calgary	https://drive.google.com/thumbnail?id=1ILWYdrgj8kh4rRXNdxcZoP0g-7iHmLGm	2024-10-17 22:43:43.122	2024-10-17 23:35:23.129
\.
COPY public."LeatherColor" (id, name, abbreviation, image_url, "createdAt", "updatedAt") FROM stdin;
cm2cns61i000113hyzw654kd9	Baby Blue	BB		2024-10-17 02:05:14.262	2024-10-17 02:00:53.044
cm2cns61i000313hyqmcgyq0e	Candy Blue	CB		2024-10-17 02:05:14.262	2024-10-17 02:01:47.703
cm2cns61i000413hy33aa3pud	Dark Chocolate	DC		2024-10-17 02:05:14.262	2024-10-17 02:01:48.123
cm2cns61i000513hy1zj3qpu3	Dark Shiny Navy	DSN		2024-10-17 02:05:14.262	2024-10-17 02:01:48.506
cm2cns61i000613hyeqj54zrz	Hot Pink	HP		2024-10-17 02:05:14.262	2024-10-17 02:01:48.702
cm2cns61i000713hyrwhg9dif	Light Royal	LR		2024-10-17 02:05:14.262	2024-10-17 02:01:48.903
cm2cns61i000813hyspmia8eq	Olive	O		2024-10-17 02:05:14.262	2024-10-17 02:01:49.09
cm2cns61i000913hyhjn0hu9g	Pebbled Black	PB		2024-10-17 02:05:14.262	2024-10-17 02:01:49.253
cm2cns61i000a13hy1flrgnqb	Powder Blue	PoBu		2024-10-17 02:05:14.262	2024-10-17 02:01:49.456
cm2cns61i000b13hy49artt54	Pebbled Crimson	PC		2024-10-17 02:05:14.262	2024-10-17 02:01:49.623
cm2cns61i000c13hy246fbglj	Pebbled Charcoal	PeCh		2024-10-17 02:05:14.262	2024-10-17 02:01:49.823
cm2cns61i000d13hyl60ce9kw	Pebbled Marshmallow	PM		2024-10-17 02:05:14.262	2024-10-17 02:01:49.99
cm2cns61i000e13hy950a9gtu	Pebbled Royal	PR		2024-10-17 02:05:14.262	2024-10-17 02:01:50.157
cm2cns61i000f13hyl9gqz9s4	Pebbled Sky Blue	PSB		2024-10-17 02:05:14.262	2024-10-17 02:01:50.541
cm2cns61i000g13hy1kz542ba	Pebbled Teal	PT		2024-10-17 02:05:14.262	2024-10-17 02:04:00.547
cm2cns61i000h13hyt01sr3py	Pebbled White	PW		2024-10-17 02:05:14.262	2024-10-17 02:04:00.983
cm2cns61i000i13hyqtgjyuaz	Rustic Walnut	RW		2024-10-17 02:05:14.262	2024-10-17 02:04:01.416
cm2cns61j000j13hy64e5qirc	Smooth Grey	SG		2024-10-17 02:05:14.262	2024-10-17 02:04:01.9
cm2cns61j000k13hyw9zokpoo	Smooth Marshmallow	SM		2024-10-17 02:05:14.262	2024-10-17 02:04:02.515
cm2cns61j000l13hy976waddm	Shiny Navy	SN		2024-10-17 02:05:14.262	2024-10-17 02:04:03.132
cm2cns61j000m13hyebmzwi47	Smooth White	SW		2024-10-17 02:05:14.262	2024-10-17 02:04:04.219
cm2cns61i000013hyeks31jrt	Butterscotch	B	https://drive.google.com/thumbnail?id=1T7LRXF-pqm7Wg0PlD6C3lPrabQbegguL	2024-10-17 02:05:14.262	2024-10-18 00:22:19.073
cm2cns61i000213hyi8jex0hf	British Racing Green	BRG	https://drive.google.com/thumbnail?id=1T7LRXF-pqm7Wg0PlD6C3lPrabQbegguL	2024-10-17 02:05:14.262	2024-10-18 00:22:19.073
\.
COPY public."ProductPrice" (id, "shopifyPrice", "higherPrice", "shapeId", "collectionId", "createdAt", "updatedAt") FROM stdin;
cm2kyjtl70000ol0je30h175b	140.00	155.00	cm2duhfg000006y58dqulghkm	297548611791	2024-10-22 21:28:50.059	2024-10-22 21:16:37.379
cm2kyjtl90001ol0jfgnjy6wp	130.00	145.00	cm2duhfg300046y58o8dsmwzo	297548611791	2024-10-22 21:28:50.059	2024-10-22 21:17:47.318
cm2kyjtl90002ol0j53txpoum	125.00	140.00	cm2duhfg300056y58ddfbtcxj	297548611791	2024-10-22 21:28:50.059	2024-10-22 21:18:24.614
cm2kyjtl90003ol0ji92ocley	150.00	165.00	cm2duhfg300066y583ii779yr	297548611791	2024-10-22 21:28:50.059	2024-10-22 21:19:07.838
cm2kyjtl90004ol0jhm1ppuul	150.00	165.00	cm2duhfg300076y585owscoo4	297548611791	2024-10-22 21:28:50.059	2024-10-22 21:19:08.422
cm2kyjtla0005ol0javeroagp	145.00	160.00	cm2duhfg000006y58dqulghkm	297538945231	2024-10-22 21:28:50.059	2024-10-22 21:20:22.433
cm2kyjtla0006ol0jb32ak0js	135.00	150.00	cm2duhfg300046y58o8dsmwzo	297538945231	2024-10-22 21:28:50.059	2024-10-22 21:20:23.015
cm2kyjtla0007ol0jut6mx23b	130.00	145.00	cm2duhfg300056y58ddfbtcxj	297538945231	2024-10-22 21:28:50.059	2024-10-22 21:20:23.602
cm2kyjtla0008ol0jshg3vqyo	150.00	165.00	cm2duhfg300066y583ii779yr	297538945231	2024-10-22 21:28:50.059	2024-10-22 21:20:24.185
cm2kyjtla0009ol0jsyakarza	150.00	165.00	cm2duhfg300076y585owscoo4	297538945231	2024-10-22 21:28:50.059	2024-10-22 21:20:24.753
cm2kyjtlb000aol0jppzv7bqq	150.00	165.00	cm2duhfg000006y58dqulghkm	297548677327	2024-10-22 21:28:50.059	2024-10-22 21:22:19.728
cm2kyjtlb000bol0jm8uzfx45	140.00	155.00	cm2duhfg300046y58o8dsmwzo	297548677327	2024-10-22 21:28:50.059	2024-10-22 21:22:20.246
cm2kyjtlb000col0ja8b1oy0v	135.00	150.00	cm2duhfg300056y58ddfbtcxj	297548677327	2024-10-22 21:28:50.059	2024-10-22 21:22:20.765
cm2kyjtlb000dol0j1kyhwc4a	150.00	165.00	cm2duhfg300066y583ii779yr	297548677327	2024-10-22 21:28:50.059	2024-10-22 21:22:21.249
cm2kyjtlb000eol0jdgcxko62	150.00	165.00	cm2duhfg300076y585owscoo4	297548677327	2024-10-22 21:28:50.059	2024-10-22 21:22:21.717
cm2kyjtlb000fol0jprtrx9it	160.00	175.00	cm2duhfg000006y58dqulghkm	297548710095	2024-10-22 21:28:50.059	2024-10-22 21:24:39.248
cm2kyjtlc000gol0jx1g84lno	150.00	165.00	cm2duhfg300046y58o8dsmwzo	297548710095	2024-10-22 21:28:50.059	2024-10-22 21:24:39.944
cm2kyjtld000hol0jeejmmpw3	145.00	160.00	cm2duhfg300056y58ddfbtcxj	297548710095	2024-10-22 21:28:50.059	2024-10-22 21:24:40.41
cm2kyjtld000iol0j7dq8cqi5	160.00	175.00	cm2duhfg300066y583ii779yr	297548710095	2024-10-22 21:28:50.059	2024-10-22 21:24:40.86
cm2kyjtld000jol0j1060r0rg	160.00	175.00	cm2duhfg300076y585owscoo4	297548710095	2024-10-22 21:28:50.059	2024-10-22 21:24:41.311
cm2kyjtle000kol0j9odbhbpr	170.00	185.00	cm2duhfg000006y58dqulghkm	297538977999	2024-10-22 21:28:50.059	2024-10-22 21:26:46.276
cm2kyjtle000lol0jvkp60h1i	160.00	175.00	cm2duhfg300046y58o8dsmwzo	297538977999	2024-10-22 21:28:50.059	2024-10-22 21:26:46.9
cm2kyjtle000mol0j1px8krkx	155.00	170.00	cm2duhfg300056y58ddfbtcxj	297538977999	2024-10-22 21:28:50.059	2024-10-22 21:26:47.467
cm2kyjtle000nol0jskq9q10b	170.00	185.00	cm2duhfg300066y583ii779yr	297538977999	2024-10-22 21:28:50.059	2024-10-22 21:26:48.016
cm2kyjtle000ool0jkyfs6p07	170.00	185.00	cm2duhfg300076y585owscoo4	297538977999	2024-10-22 21:28:50.059	2024-10-22 21:26:48.537
\.
COPY public."Session" (id, shop, state, "isOnline", scope, expires, "accessToken", "userId", "firstName", "lastName", email, "accountOwner", locale, collaborator, "emailVerified") FROM stdin;
offline_lpc-product-creation.myshopify.com	lpc-product-creation.myshopify.com		f	read_orders,write_products	\N	shpua_108e6399798f3be3d4bd3a56e20f07a9	\N	\N	\N	\N	f	\N	f	f
\.
COPY public."_LeatherColorToTag" ("A", "B") FROM stdin;
cm2mblrjs0000rza90jsilvze	cm2cns61i000413hy33aa3pud
cm2mblrjs0000rza90jsilvze	cm2cns61i000i13hyqtgjyuaz
cm2mblrjs0000rza90jsilvze	cm2cns61i000013hyeks31jrt
cm2mblrjt0001rza9che6immo	cm2cns61i000913hyhjn0hu9g
cm2mblrjt0002rza9ygl9e1vs	cm2cns61i000113hyzw654kd9
cm2mblrjt0002rza9ygl9e1vs	cm2cns61i000313hyqmcgyq0e
cm2mblrjt0002rza9ygl9e1vs	cm2cns61i000513hy1zj3qpu3
cm2mblrjt0002rza9ygl9e1vs	cm2cns61i000713hyrwhg9dif
cm2mblrjt0002rza9ygl9e1vs	cm2cns61i000a13hy1flrgnqb
cm2mblrjt0002rza9ygl9e1vs	cm2cns61i000e13hy950a9gtu
cm2mblrjt0002rza9ygl9e1vs	cm2cns61i000f13hyl9gqz9s4
cm2mblrjt0002rza9ygl9e1vs	cm2cns61i000g13hy1kz542ba
cm2mblrjt0002rza9ygl9e1vs	cm2cns61j000l13hy976waddm
cm2mblrju0003rza9kc0up31s	cm2cns61i000813hyspmia8eq
cm2mblrju0003rza9kc0up31s	cm2cns61i000g13hy1kz542ba
cm2mblrju0003rza9kc0up31s	cm2cns61i000213hyi8jex0hf
cm2mblrju0004rza94514jymr	cm2cns61i000c13hy246fbglj
cm2mblrju0004rza94514jymr	cm2cns61j000j13hy64e5qirc
cm2mblrjv0006rza9taki52xq	cm2cns61i000613hyeqj54zrz
cm2mblrjv0006rza9taki52xq	cm2cns61i000b13hy49artt54
cm2mblrjv0007rza97rb4gbuh	cm2cns61i000013hyeks31jrt
cm2mblrjv0008rza9zrlar9ef	cm2cns61i000d13hyl60ce9kw
cm2mblrjv0008rza9zrlar9ef	cm2cns61i000h13hyt01sr3py
cm2mblrjv0008rza9zrlar9ef	cm2cns61j000k13hyw9zokpoo
cm2mblrjv0008rza9zrlar9ef	cm2cns61j000m13hyebmzwi47
\.
COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
6385e681-02b7-4b14-94d5-6ed5b159ce6a	c597a28f9638ecf08b82c0b43ff8a7a0c165619e49260c916be5a6d870dbdcea	2024-10-16 18:22:34.884593-07	20241016222946_init	\N	\N	2024-10-16 18:22:34.880614-07	1
