--
-- PostgreSQL database dump
--

-- Dumped from database version 17.0 (Postgres.app)
-- Dumped by pg_dump version 17.0 (Postgres.app)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: StitchingThread; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."StitchingThread" (id, name, abbreviation, "createdAt", "updatedAt") FROM stdin;
cm2dvxbki0000145djbebncw9	Dark Chocolate	DCS	2024-10-17 22:40:57.81	2024-10-17 22:38:04.874
cm2dvxbki0001145dj5azmbmp	Ivory	IS	2024-10-17 22:40:57.81	2024-10-17 22:38:05.372
cm2dvxbki0002145d6ugzphtp	Black	BS	2024-10-17 22:40:57.81	2024-10-17 22:38:05.856
cm2dvxbki0003145d6ns02rq9	Gold	GS	2024-10-17 22:40:57.81	2024-10-17 22:38:06.475
cm2dvxbki0004145drl0lylfj	Navy	NS	2024-10-17 22:40:57.81	2024-10-17 22:38:06.958
cm2dvxbki0005145d3phoi7xo	Burbon	BuS	2024-10-17 22:40:57.81	2024-10-17 22:38:07.442
cm2dvxbki0006145dt0o9ajvw	Hot Pink	HPS	2024-10-17 22:40:57.81	2024-10-17 22:38:07.942
cm2dvxbki0007145dm0cq0uhw	Crimson	CrS	2024-10-17 22:40:57.81	2024-10-17 22:38:08.41
cm2dvxbki0008145dt5iddlgw	Cinnamon	CiS	2024-10-17 22:40:57.81	2024-10-17 22:38:08.893
cm2dvxbki0009145db6zdbkac	Royal Blue	RBS	2024-10-17 22:40:57.81	2024-10-17 22:38:09.377
cm2qgaof600001g1dz74jp579	Beige	BeS	2024-10-26 17:44:27.426	2024-10-26 17:16:32.01
cm2qgaof600011g1dp0u6h8rj	Orange	OS	2024-10-26 17:44:27.426	2024-10-26 17:33:19.231
cm2qgaof600021g1dm3492c46	Canary Yellow	CYS	2024-10-26 17:44:27.426	2024-10-26 17:33:34.527
cm2qgaof600031g1diekivra8	Baby Blue	BBS	2024-10-26 17:44:27.426	2024-10-26 17:33:55.06
cm2qgaof600041g1d3ydxcw0k	Olive	OlS	2024-10-26 17:44:27.426	2024-10-26 17:34:02.182
cm2qgaof600051g1dpktyh5ln	Forest Green	FGS	2024-10-26 17:44:27.426	2024-10-26 17:34:09.689
cm2qgaof600061g1dlelq43ou	Red	RS	2024-10-26 17:44:27.426	2024-10-26 17:34:28.454
cm2qgaof600071g1dor51myoe	Teal	TS	2024-10-26 17:44:27.426	2024-10-26 17:34:46.836
cm2qgaof700081g1dvacvsfuy	Bubblegum	BubS	2024-10-26 17:44:27.426	2024-10-26 17:35:34.478
cm2qgaof700091g1dkc931kol	White	WS	2024-10-26 17:44:27.426	2024-10-26 17:36:46.436
cm2qgaof7000a1g1dvndqvxgt	Silver	SS	2024-10-26 17:44:27.426	2024-10-26 17:36:56.077
cm2qgaof7000b1g1d58lej3q9	Charcol	ChS	2024-10-26 17:44:27.426	2024-10-26 17:37:09.506
cm2qgaof7000c1g1dp877zci4	Pumpkin	PuS	2024-10-26 17:44:27.426	2024-10-26 17:38:11.49
cm2qgaof7000d1g1d381xj9o3	Plum	PlS	2024-10-26 17:44:27.426	2024-10-26 17:38:20.048
cm2qgaof7000e1g1dlkcw80ui	Purple	PS	2024-10-26 17:44:27.426	2024-10-26 17:38:28.154
cm2y52hv2000t48z7j51a8quq	Dark Navy	DNS	2024-11-01 02:52:19.31	2024-11-01 02:50:11.211
cm2y52hv2000u48z7ckvo0gmh	Burnt Orange	BOS	2024-11-01 02:52:19.31	2024-11-01 02:50:24.856
cm2y52hv2000v48z70i2w0z05	Taupe	TaS	2024-11-01 02:52:19.31	2024-11-01 02:50:38.234
\.


--
-- Data for Name: AmannNumber; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."AmannNumber" (id, number, "threadId", "createdAt", "updatedAt") FROM stdin;
cm2y536jh000w48z75shmiwsz	3121	cm2dvxbki0000145djbebncw9	2024-11-01 02:52:51.294	2024-11-01 02:33:55.756
cm2y536jh000x48z7euhd13g0	2046	cm2dvxbki0001145dj5azmbmp	2024-11-01 02:52:51.294	2024-11-01 02:33:55.951
cm2y536ji000y48z7qkxmkol3	4000	cm2dvxbki0002145d6ugzphtp	2024-11-01 02:52:51.294	2024-11-01 02:33:56.152
cm2y536ji000z48z754vc4wiq	3329	cm2dvxbki0003145d6ns02rq9	2024-11-01 02:52:51.294	2024-11-01 02:33:56.334
cm2y536ji001048z794z8oglz	3116	cm2dvxbki0003145d6ns02rq9	2024-11-01 02:52:51.294	2024-11-01 02:33:56.534
cm2y536ji001148z7y6rqoql3	0809	cm2dvxbki0004145drl0lylfj	2024-11-01 02:52:51.294	2024-11-01 02:33:56.752
cm2y536ji001248z7xrl6knef	2310	cm2dvxbki0004145drl0lylfj	2024-11-01 02:52:51.294	2024-11-01 02:33:56.936
cm2y536ji001348z7f67wduzp	3130	cm2dvxbki0005145d3phoi7xo	2024-11-01 02:52:51.294	2024-11-01 02:33:57.152
cm2y536ji001448z7hgaj9p7q	0900	cm2dvxbki0005145d3phoi7xo	2024-11-01 02:52:51.294	2024-11-01 02:33:57.352
cm2y536ji001548z7m5q4bkgt	u-bond 40	cm2dvxbki0006145dt0o9ajvw	2024-11-01 02:52:51.294	2024-11-01 02:33:57.537
cm2y536ji001648z7zyc2hpkt	0918	cm2dvxbki0007145dm0cq0uhw	2024-11-01 02:52:51.294	2024-11-01 02:33:57.751
cm2y536ji001748z7uydt0tnj	3135	cm2dvxbki0007145dm0cq0uhw	2024-11-01 02:52:51.294	2024-11-01 02:33:57.988
cm2y536ji001848z71u34dfwn	0815	cm2dvxbki0009145db6zdbkac	2024-11-01 02:52:51.294	2024-11-01 02:33:58.204
cm2y536ji001948z7abb2epq4	3125	cm2dvxbki0009145db6zdbkac	2024-11-01 02:52:51.294	2024-11-01 02:33:58.404
cm2y536ji001a48z776tdlj19	3116	cm2qgaof600001g1dz74jp579	2024-11-01 02:52:51.294	2024-11-01 02:33:58.62
cm2y536ji001b48z722iwumv7	3516	cm2qgaof600011g1dp0u6h8rj	2024-11-01 02:52:51.294	2024-11-01 02:33:58.822
cm2y536ji001c48z7dtsl4ee1	3361	cm2qgaof600021g1dm3492c46	2024-11-01 02:52:51.294	2024-11-01 02:33:59.235
cm2y536jj001d48z79in7mwd9	0272	cm2qgaof600031g1diekivra8	2024-11-01 02:52:51.294	2024-11-01 02:33:59.438
cm2y536jj001e48z7balhvs4e	0667	cm2qgaof600041g1d3ydxcw0k	2024-11-01 02:52:51.294	2024-11-01 02:33:59.634
cm2y536jj001f48z70hr2hqkg	7095	cm2qgaof600051g1dpktyh5ln	2024-11-01 02:52:51.294	2024-11-01 02:33:59.852
cm2y536jj001g48z7cld2uumy	u-bond 43	cm2qgaof700081g1dvacvsfuy	2024-11-01 02:52:51.294	2024-11-01 02:34:00.089
cm2y536jj001h48z753283bas	1000	cm2qgaof700091g1dkc931kol	2024-11-01 02:52:51.294	2024-11-01 02:34:00.272
cm2y536jk001i48z7ddf9fz4q	6359	cm2qgaof7000a1g1dvndqvxgt	2024-11-01 02:52:51.294	2024-11-01 02:34:00.472
cm2y536jk001j48z76wkdcg68	1237	cm2qgaof7000b1g1d58lej3q9	2024-11-01 02:52:51.294	2024-11-01 02:34:00.671
cm2y536jk001k48z78pr7zmk0	1288	cm2qgaof7000c1g1dp877zci4	2024-11-01 02:52:51.294	2024-11-01 02:34:00.89
cm2y536jk001l48z773je6cdi	2175	cm2qgaof7000e1g1dlkcw80ui	2024-11-01 02:52:51.294	2024-11-01 02:41:54.601
cm2y536jk001m48z7rtglmwwg	2310	cm2y52hv2000t48z7j51a8quq	2024-11-01 02:52:51.294	2024-11-01 02:41:54.766
cm2y536jl001n48z7whw5a566	1074	cm2y52hv2000u48z7ckvo0gmh	2024-11-01 02:52:51.294	2024-11-01 02:41:54.967
cm2y536jl001o48z7zlngj8qt	3129	cm2y52hv2000v48z70i2w0z05	2024-11-01 02:52:51.294	2024-11-01 02:42:32.366
cm2y536jl001p48z780qpckb5	2455	cm2qgaof600061g1dlelq43ou	2024-11-01 02:52:51.294	2024-11-01 02:48:31.164
cm2y536jl001q48z7d0dmmmlv	2830	cm2qgaof600071g1dor51myoe	2024-11-01 02:52:51.294	2024-11-01 02:48:31.359
\.


--
-- Data for Name: ColorTag; Type: TABLE DATA; Schema: public; Owner: postgres
--

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
cm2mebmob0001tiahntejewdn	Ivory	2024-10-23 21:38:07.884	2024-10-23 21:38:07.884
cm2mebmoi0003tiahocybdf8z	Gold	2024-10-23 21:38:07.89	2024-10-23 21:38:07.89
cm2mebmol0004tiahr0z9rvbg	Navy	2024-10-23 21:38:07.894	2024-10-23 21:38:07.894
cm2mebmon0005tiahf8avp5pv	Burbon	2024-10-23 21:38:07.896	2024-10-23 21:38:07.896
cm2mebmot0007tiaha6xezr9y	Crimson	2024-10-23 21:38:07.901	2024-10-23 21:38:07.901
cm2mebmov0008tiah9tlhwbum	Cinnamon	2024-10-23 21:38:07.904	2024-10-23 21:38:07.904
cm2mebmox0009tiahcm9z5e4z	Royal Blue	2024-10-23 21:38:07.905	2024-10-23 21:38:07.905
cm2mebmoq0006tiahjkauvtal	Pink	2024-10-23 21:38:07.899	2024-10-26 17:43:02.866
cm2qgc1m5000f1g1dhnhm1qa1	Yellow	2024-10-26 17:45:31.181	2024-10-26 17:45:21.395
cm2qge50d000g1g1d6hnfclsq	Orange	2024-10-26 17:47:08.893	2024-10-26 17:46:54.423
\.


--
-- Data for Name: EmbroideryThread; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."EmbroideryThread" (id, name, abbreviation, "createdAt", "updatedAt") FROM stdin;
cm2dvxbki0000145djbebncw9	Dark Chocolate	DCS	2024-10-17 22:40:57.81	2024-10-17 22:38:04.874
cm2dvxbki0001145dj5azmbmp	Ivory	IS	2024-10-17 22:40:57.81	2024-10-17 22:38:05.372
cm2dvxbki0002145d6ugzphtp	Black	BS	2024-10-17 22:40:57.81	2024-10-17 22:38:05.856
cm2dvxbki0003145d6ns02rq9	Gold	GS	2024-10-17 22:40:57.81	2024-10-17 22:38:06.475
cm2dvxbki0004145drl0lylfj	Navy	NS	2024-10-17 22:40:57.81	2024-10-17 22:38:06.958
cm2dvxbki0005145d3phoi7xo	Burbon	BuS	2024-10-17 22:40:57.81	2024-10-17 22:38:07.442
cm2dvxbki0006145dt0o9ajvw	Hot Pink	HPS	2024-10-17 22:40:57.81	2024-10-17 22:38:07.942
cm2dvxbki0007145dm0cq0uhw	Crimson	CrS	2024-10-17 22:40:57.81	2024-10-17 22:38:08.41
cm2dvxbki0008145dt5iddlgw	Cinnamon	CiS	2024-10-17 22:40:57.81	2024-10-17 22:38:08.893
cm2dvxbki0009145db6zdbkac	Royal Blue	RBS	2024-10-17 22:40:57.81	2024-10-17 22:38:09.377
cm2qgaof600001g1dz74jp579	Beige	BeS	2024-10-26 17:44:27.426	2024-10-26 17:16:32.01
cm2qgaof600011g1dp0u6h8rj	Orange	OS	2024-10-26 17:44:27.426	2024-10-26 17:33:19.231
cm2qgaof600021g1dm3492c46	Canary Yellow	CYS	2024-10-26 17:44:27.426	2024-10-26 17:33:34.527
cm2qgaof600031g1diekivra8	Baby Blue	BBS	2024-10-26 17:44:27.426	2024-10-26 17:33:55.06
cm2qgaof600041g1d3ydxcw0k	Olive	OlS	2024-10-26 17:44:27.426	2024-10-26 17:34:02.182
cm2qgaof600051g1dpktyh5ln	Forest Green	FGS	2024-10-26 17:44:27.426	2024-10-26 17:34:09.689
cm2qgaof600061g1dlelq43ou	Red	RS	2024-10-26 17:44:27.426	2024-10-26 17:34:28.454
cm2qgaof600071g1dor51myoe	Teal	TS	2024-10-26 17:44:27.426	2024-10-26 17:34:46.836
cm2qgaof700081g1dvacvsfuy	Bubblegum	BubS	2024-10-26 17:44:27.426	2024-10-26 17:35:34.478
cm2qgaof700091g1dkc931kol	White	WS	2024-10-26 17:44:27.426	2024-10-26 17:36:46.436
cm2qgaof7000a1g1dvndqvxgt	Silver	SS	2024-10-26 17:44:27.426	2024-10-26 17:36:56.077
cm2qgaof7000b1g1d58lej3q9	Charcol	ChS	2024-10-26 17:44:27.426	2024-10-26 17:37:09.506
cm2qgaof7000c1g1dp877zci4	Pumpkin	PuS	2024-10-26 17:44:27.426	2024-10-26 17:38:11.49
cm2qgaof7000d1g1d381xj9o3	Plum	PlS	2024-10-26 17:44:27.426	2024-10-26 17:38:20.048
cm2qgaof7000e1g1dlkcw80ui	Purple	PS	2024-10-26 17:44:27.426	2024-10-26 17:38:28.154
\.


--
-- Data for Name: Font; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Font" (id, name, image_url, "createdAt", "updatedAt") FROM stdin;
cm2dw0v4h000b145d70dzv395	Gothic	https://drive.google.com/thumbnail?id=1SN3l-VTGEtTLdWUh5UWSoLdSJ5XEfsQa	2024-10-17 22:43:43.122	2024-10-17 23:30:56.271
cm2dw0v4h000a145doemuo7c1	Block	https://drive.google.com/thumbnail?id=1T7LRXF-pqm7Wg0PlD6C3lPrabQbegguL	2024-10-17 22:43:43.122	2024-10-17 23:35:23.129
cm2dw0v4h000c145dyla794mf	Los Angeles	https://drive.google.com/thumbnail?id=15hhiO0rMsExIACZYmEtvGz1n43mDNuzM	2024-10-17 22:43:43.122	2024-10-17 23:35:23.129
cm2dw0v4h000d145d7gnug20z	San Diego	https://drive.google.com/thumbnail?id=165en1xBa3Nei-_2BYr7CUv9RIM0ewlxm	2024-10-17 22:43:43.122	2024-10-17 23:35:23.129
cm2dw0v4h000e145d6aof3d2i	Serif	https://drive.google.com/thumbnail?id=1zCfxQzXeBb_gBNQhTaz3KoIlsJRugDg-	2024-10-17 22:43:43.122	2024-10-17 23:35:23.129
cm2dw0v4h000f145dz3h6i58o	Saipan	https://drive.google.com/thumbnail?id=1HkKc8sRiQef72wURoBHyW65NCE5Krs0V	2024-10-17 22:43:43.122	2024-10-17 23:35:23.129
cm2dw0v4h000g145d0v6tpp72	Calgary	https://drive.google.com/thumbnail?id=1ILWYdrgj8kh4rRXNdxcZoP0g-7iHmLGm	2024-10-17 22:43:43.122	2024-10-17 23:35:23.129
\.


--
-- Data for Name: IsacordNumber; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."IsacordNumber" (id, number, "threadId", "createdAt", "updatedAt") FROM stdin;
cm2y27m1s000048z7mktvh1ka	1346	cm2dvxbki0000145djbebncw9	2024-11-01 01:32:19.168	2024-11-01 01:19:35.388
cm2y27m1s000148z7lxqzsda5	0660	cm2dvxbki0001145dj5azmbmp	2024-11-01 01:32:19.168	2024-11-01 01:19:35.584
cm2y27m1s000248z7wj9j449y	0020	cm2dvxbki0002145d6ugzphtp	2024-11-01 01:32:19.168	2024-11-01 01:19:35.938
cm2y27m1s000348z78bzil3x8	0731	cm2dvxbki0003145d6ns02rq9	2024-11-01 01:32:19.168	2024-11-01 01:19:36.12
cm2y27m1s000448z7nl99itm1	3644	cm2dvxbki0004145drl0lylfj	2024-11-01 01:32:19.168	2024-11-01 01:19:36.27
cm2y27m1t000548z7kouwtorv	1233	cm2dvxbki0005145d3phoi7xo	2024-11-01 01:32:19.168	2024-11-01 01:19:36.471
cm2y27m1t000648z7s5jeb0tx	2532	cm2dvxbki0006145dt0o9ajvw	2024-11-01 01:32:19.168	2024-11-01 01:19:36.654
cm2y27m1t000748z7yebqieu6	1912	cm2dvxbki0007145dm0cq0uhw	2024-11-01 01:32:19.168	2024-11-01 01:19:36.854
cm2y27m1t000848z7a3aiu004	3600	cm2dvxbki0009145db6zdbkac	2024-11-01 01:32:19.168	2024-11-01 01:19:37.054
cm2y27m1u000948z7x93olr1k	1123	cm2qgaof600001g1dz74jp579	2024-11-01 01:32:19.168	2024-11-01 01:19:37.256
cm2y27m1u000a48z7qysy5k4p	1310	cm2qgaof600011g1dp0u6h8rj	2024-11-01 01:32:19.168	2024-11-01 01:19:37.47
cm2y27m1u000b48z70y5i5c7i	0605	cm2qgaof600021g1dm3492c46	2024-11-01 01:32:19.168	2024-11-01 01:19:37.655
cm2y27m1u000c48z7yjmiywfl	3761	cm2qgaof600031g1diekivra8	2024-11-01 01:32:19.168	2024-11-01 01:19:37.872
cm2y27m1u000d48z7uriadjzn	3951	cm2qgaof600031g1diekivra8	2024-11-01 01:32:19.168	2024-11-01 01:19:38.073
cm2y27m1u000e48z798ukvc5s	6133	cm2qgaof600041g1d3ydxcw0k	2024-11-01 01:32:19.168	2024-11-01 01:19:38.272
cm2y27m1u000f48z7luc2qx5b	5934	cm2qgaof600041g1d3ydxcw0k	2024-11-01 01:32:19.168	2024-11-01 01:19:38.455
cm2y27m1u000g48z7zt7uct1l	5565	cm2qgaof600051g1dpktyh5ln	2024-11-01 01:32:19.168	2024-11-01 01:23:04.409
cm2y27m1u000h48z7dko21frb	2101	cm2qgaof600061g1dlelq43ou	2024-11-01 01:32:19.168	2024-11-01 01:23:04.591
cm2y27m1u000i48z77j6r7o23	4620	cm2qgaof600071g1dor51myoe	2024-11-01 01:32:19.168	2024-11-01 01:23:04.777
cm2y27m1u000j48z7nmcjk586	2550	cm2qgaof700081g1dvacvsfuy	2024-11-01 01:32:19.168	2024-11-01 01:23:04.941
cm2y27m1u000k48z77aa04cjd	0017	cm2qgaof700091g1dkc931kol	2024-11-01 01:32:19.168	2024-11-01 01:23:05.109
cm2y27m1u000l48z7y8yffy4r	3971	cm2qgaof7000a1g1dvndqvxgt	2024-11-01 01:32:19.168	2024-11-01 01:23:05.292
cm2y27m1u000m48z76qyf4fwt	0138	cm2qgaof7000b1g1d58lej3q9	2024-11-01 01:32:19.168	2024-11-01 01:23:05.507
cm2y27m1u000n48z7aegkjc0o	0111	cm2qgaof7000b1g1d58lej3q9	2024-11-01 01:32:19.168	2024-11-01 01:23:05.708
cm2y27m1v000o48z787ur95vj	1332	cm2qgaof7000c1g1dp877zci4	2024-11-01 01:32:19.168	2024-11-01 01:23:05.89
cm2y27m1v000p48z7sg92ihqu	2715	cm2qgaof7000d1g1d381xj9o3	2024-11-01 01:32:19.168	2024-11-01 01:23:52.481
cm2y27m1v000q48z7mc3myiep	2905	cm2qgaof7000e1g1dlkcw80ui	2024-11-01 01:32:19.168	2024-11-01 01:23:52.681
cm2y27m1v000r48z793l8y3gs	9150	cm2dvxbki0008145dt5iddlgw	2024-11-01 01:32:19.168	2024-11-01 01:23:52.848
cm2y27m1v000s48z7ba9xlc5r	1233	cm2dvxbki0008145dt5iddlgw	2024-11-01 01:32:19.168	2024-11-01 01:23:53.032
\.


--
-- Data for Name: LeatherColor; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."LeatherColor" (id, name, abbreviation, image_url, "createdAt", "updatedAt", "isLimitedEditionLeather") FROM stdin;
cm2cns61i000113hyzw654kd9	Baby Blue	BB		2024-10-17 02:05:14.262	2024-10-17 02:00:53.044	f
cm2cns61i000313hyqmcgyq0e	Candy Blue	CB		2024-10-17 02:05:14.262	2024-10-17 02:01:47.703	f
cm2cns61i000413hy33aa3pud	Dark Chocolate	DC		2024-10-17 02:05:14.262	2024-10-17 02:01:48.123	f
cm2cns61i000613hyeqj54zrz	Hot Pink	HP		2024-10-17 02:05:14.262	2024-10-17 02:01:48.702	f
cm2cns61i000713hyrwhg9dif	Light Royal	LR		2024-10-17 02:05:14.262	2024-10-17 02:01:48.903	f
cm2cns61i000913hyhjn0hu9g	Pebbled Black	PB		2024-10-17 02:05:14.262	2024-10-17 02:01:49.253	f
cm2cns61i000a13hy1flrgnqb	Powder Blue	PoBu		2024-10-17 02:05:14.262	2024-10-17 02:01:49.456	f
cm2cns61i000b13hy49artt54	Pebbled Crimson	PC		2024-10-17 02:05:14.262	2024-10-17 02:01:49.623	f
cm2cns61i000c13hy246fbglj	Pebbled Charcoal	PeCh		2024-10-17 02:05:14.262	2024-10-17 02:01:49.823	f
cm2cns61i000d13hyl60ce9kw	Pebbled Marshmallow	PM		2024-10-17 02:05:14.262	2024-10-17 02:01:49.99	f
cm2cns61i000e13hy950a9gtu	Pebbled Royal	PR		2024-10-17 02:05:14.262	2024-10-17 02:01:50.157	f
cm2cns61i000g13hy1kz542ba	Pebbled Teal	PT		2024-10-17 02:05:14.262	2024-10-17 02:04:00.547	f
cm2cns61i000h13hyt01sr3py	Pebbled White	PW		2024-10-17 02:05:14.262	2024-10-17 02:04:00.983	f
cm2cns61i000i13hyqtgjyuaz	Rustic Walnut	RW		2024-10-17 02:05:14.262	2024-10-17 02:04:01.416	f
cm2cns61j000j13hy64e5qirc	Smooth Grey	SG		2024-10-17 02:05:14.262	2024-10-17 02:04:01.9	f
cm2cns61j000k13hyw9zokpoo	Smooth Marshmallow	SM		2024-10-17 02:05:14.262	2024-10-17 02:04:02.515	f
cm2cns61j000l13hy976waddm	Shiny Navy	SN		2024-10-17 02:05:14.262	2024-10-17 02:04:03.132	f
cm2cns61j000m13hyebmzwi47	Smooth White	SW		2024-10-17 02:05:14.262	2024-10-17 02:04:04.219	f
cm2cns61i000013hyeks31jrt	Butterscotch	B	https://drive.google.com/thumbnail?id=1T7LRXF-pqm7Wg0PlD6C3lPrabQbegguL	2024-10-17 02:05:14.262	2024-10-18 00:22:19.073	f
cm2cns61i000213hyi8jex0hf	British Racing Green	BRG	https://drive.google.com/thumbnail?id=1T7LRXF-pqm7Wg0PlD6C3lPrabQbegguL	2024-10-17 02:05:14.262	2024-10-18 00:22:19.073	f
cm2cns61i000813hyspmia8eq	Rustic Olive	O		2024-10-17 02:05:14.262	2024-10-26 18:02:27.649	f
cm2qgxtxc000j1g1dovq0j7ei	Rustic Ostrich	RO	\N	2024-10-26 18:02:27.649	2024-10-26 18:02:57.96	f
cm2qgxtxc000i1g1dbi0p3ux9	Shiny Black Ostrich	BSO	\N	2024-10-26 18:02:27.649	2024-10-26 18:02:57.96	f
cm2qgxtxd000k1g1dhkhrkj2g	Silver Croc	SC	\N	2024-10-26 18:02:27.649	2024-10-26 18:02:57.96	f
cm2qgxtxd000l1g1dy5o1gbu5	White Ostrich	WO	\N	2024-10-26 18:02:27.649	2024-10-26 18:02:57.96	f
cm2qgxtxc000h1g1d0oojrfn1	Antique Ostrich	AO	\N	2024-10-26 18:02:27.649	2024-10-26 18:03:25.063	f
\.


--
-- Data for Name: Shape; Type: TABLE DATA; Schema: public; Owner: postgres
--

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


--
-- Data for Name: ShopifyCollections; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."ShopifyCollections" (id, "shopifyId", title, handle, "createdAt", "updatedAt", admin_graphql_api_id) FROM stdin;
cm2nk5qi8000113g4uutiklwy	430414692631	Classic	classic	2024-10-24 17:09:16.784	2024-10-24 17:03:34.114	gid://shopify/Collection/430414692631
cm2nk5qi9000213g42b33wihd	430415872279	Argyle	argyle	2024-10-24 17:09:16.784	2024-10-24 17:03:34.564	gid://shopify/Collection/430415872279
cm2nk5qi9000313g4112ddfgp	465904730391	One-Off Creations	one-off-creations	2024-10-24 17:09:16.784	2024-10-24 17:03:35.028	gid://shopify/Collection/465904730391
cm2nk5qi9000413g415csqbkq	470240231703	Quilted Classic	classic-quilted	2024-10-24 17:09:16.784	2024-10-24 17:03:35.464	gid://shopify/Collection/470240231703
cm2nk5qi9000513g4daix79qn	430259470615	Animal Print	animal-print	2024-10-24 17:09:16.784	2024-10-24 17:03:35.982	gid://shopify/Collection/430259470615
cm2nkaznh000613g4b2ocmg9n	430259437847	Quilted	quilted	2024-10-24 17:13:21.917	2024-10-24 17:12:36.697	gid://shopify/Collection/430259437847
\.


--
-- Data for Name: Style; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Style" (id, name, abbreviation, image_url, "createdAt", "updatedAt") FROM stdin;
cm2duk0zo00086y581yq5luh2	Teardrop	Tear	\N	2024-10-17 22:02:37.956	2024-10-17 22:01:04.028
cm2duk0zp00096y58txlhef0r	2 Stripe	2	\N	2024-10-23 22:11:25.716	2024-10-23 22:09:06.53
cm2duk0zp000a6y58as5sriok	3 Stripe	3	\N	2024-10-23 22:11:25.716	2024-10-23 22:09:07.063
cm2duk0zp000b6y58ni0lmpzy	Racing Stripe	Racing	\N	2024-10-23 22:11:25.716	2024-10-23 22:09:07.677
cm2duk0zp000c6y58p4822b5n	50/50	50	\N	2024-10-23 22:11:25.716	2024-10-23 22:09:08.347
cm2duk0zp000d6y58z7vvtz3o	Fat Stripe	Fat	\N	2024-10-23 22:11:25.716	2024-10-23 22:09:09.398
cm2duk0zp000e6y58p91axp5o	Fat Middle	Middle	\N	2024-10-23 22:11:25.716	2024-10-23 22:09:10.266
cm2mfig7o0000j10yb8ocpijj	Quilted Bottom	QBottom	\N	2024-10-23 22:11:25.716	2024-10-23 22:10:16.853
\.


--
-- Data for Name: ProductDataLPC; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."ProductDataLPC" (id, "shopifyProductId", "shopifyVariantId", "shopifyInventoryId", "SKU", "collectionId", "fontId", "shapeId", weight, "leatherColor1Id", "leatherColor2Id", "amannId", "isacordId", "styleId", "quiltedLeatherColorId", "mainHandle", "createdAt", "updatedAt", "offeringType") FROM stdin;
cm30tfltt000514963wgxwhng	gid://shopify/Product/7563088101583	gid://shopify/ProductVariant/44023073865935	gid://shopify/InventoryItem/46137908199631	Quilted-CB-IS-Mallet-Custom	cm2nkaznh000613g4b2ocmg9n	cm2dw0v4h000c145dyla794mf	cm2duhfg300066y583ii779yr	8.10	cm2cns61i000313hyqmcgyq0e	\N	cm2y536ji000y48z7qkxmkol3	cm2y27m1s000148z7lxqzsda5	\N	\N	candy-blue-leather-quilted-with-ivory-stitching-golf-headcovers	2024-11-02 23:49:54.113	2024-11-02 23:49:54.113	customizable
cm30tfltt0007149625svcngm	gid://shopify/Product/7563088101583	gid://shopify/ProductVariant/44023073833167	gid://shopify/InventoryItem/46137908166863	Quilted-CB-IS-Hybrid-Custom	cm2nkaznh000613g4b2ocmg9n	cm2dw0v4h000c145dyla794mf	cm2duhfg300056y58ddfbtcxj	9.40	cm2cns61i000313hyqmcgyq0e	\N	cm2y536ji000y48z7qkxmkol3	cm2y27m1s000148z7lxqzsda5	\N	\N	candy-blue-leather-quilted-with-ivory-stitching-golf-headcovers	2024-11-02 23:49:54.113	2024-11-02 23:49:54.113	customizable
cm30tflt7000014967d56wral	gid://shopify/Product/7563088101583	gid://shopify/ProductVariant/44023073571023	gid://shopify/InventoryItem/46137907904719	Quilted-CB-IS-Driver	cm2nkaznh000613g4b2ocmg9n	cm2dw0v4h000c145dyla794mf	cm2duhfg000006y58dqulghkm	3.50	cm2cns61i000313hyqmcgyq0e	\N	cm2y536ji000y48z7qkxmkol3	cm2y27m1s000148z7lxqzsda5	\N	\N	candy-blue-leather-quilted-with-ivory-stitching-golf-headcovers	2024-11-02 23:49:54.092	2024-11-02 23:49:54.092	customizable
cm30tflts00011496juvljrs9	gid://shopify/Product/7563088101583	gid://shopify/ProductVariant/44023073603791	gid://shopify/InventoryItem/46137907937487	Quilted-CB-IS-3Wood	cm2nkaznh000613g4b2ocmg9n	cm2dw0v4h000c145dyla794mf	cm2duhfg300016y58sr14qoxd	6.40	cm2cns61i000313hyqmcgyq0e	\N	cm2y536ji000y48z7qkxmkol3	cm2y27m1s000148z7lxqzsda5	\N	\N	candy-blue-leather-quilted-with-ivory-stitching-golf-headcovers	2024-11-02 23:49:54.112	2024-11-02 23:49:54.112	customizable
cm30tfltt00061496j9gjmodv	gid://shopify/Product/7563088101583	gid://shopify/ProductVariant/44023073800399	gid://shopify/InventoryItem/46137908134095	Quilted-CB-IS-Fairway-Custom	cm2nkaznh000613g4b2ocmg9n	cm2dw0v4h000c145dyla794mf	cm2duhfg300046y58o8dsmwzo	6.40	cm2cns61i000313hyqmcgyq0e	\N	cm2y536ji000y48z7qkxmkol3	cm2y27m1s000148z7lxqzsda5	\N	\N	candy-blue-leather-quilted-with-ivory-stitching-golf-headcovers	2024-11-02 23:49:54.113	2024-11-02 23:49:54.113	customizable
cm30tfltt0004149627t1eoes	gid://shopify/Product/7563088101583	gid://shopify/ProductVariant/44023073767631	gid://shopify/InventoryItem/46137908101327	Quilted-CB-IS-Driver-Custom	cm2nkaznh000613g4b2ocmg9n	cm2dw0v4h000c145dyla794mf	cm2duhfg000006y58dqulghkm	3.50	cm2cns61i000313hyqmcgyq0e	\N	cm2y536ji000y48z7qkxmkol3	cm2y27m1s000148z7lxqzsda5	\N	\N	candy-blue-leather-quilted-with-ivory-stitching-golf-headcovers	2024-11-02 23:49:54.113	2024-11-02 23:49:54.113	customizable
cm30tfltt00081496yli0cw1l	gid://shopify/Product/7563088101583	gid://shopify/ProductVariant/44023073669327	gid://shopify/InventoryItem/46137908003023	Quilted-CB-IS-Hybrid	cm2nkaznh000613g4b2ocmg9n	cm2dw0v4h000c145dyla794mf	cm2duhfg300056y58ddfbtcxj	9.40	cm2cns61i000313hyqmcgyq0e	\N	cm2y536ji000y48z7qkxmkol3	cm2y27m1s000148z7lxqzsda5	\N	\N	candy-blue-leather-quilted-with-ivory-stitching-golf-headcovers	2024-11-02 23:49:54.113	2024-11-02 23:49:54.113	customizable
cm30tfltt00031496uhrdbt53	gid://shopify/Product/7563088101583	gid://shopify/ProductVariant/44023073702095	gid://shopify/InventoryItem/46137908035791	Quilted-CB-IS-Mallet	cm2nkaznh000613g4b2ocmg9n	cm2dw0v4h000c145dyla794mf	cm2duhfg300066y583ii779yr	8.10	cm2cns61i000313hyqmcgyq0e	\N	cm2y536ji000y48z7qkxmkol3	cm2y27m1s000148z7lxqzsda5	\N	\N	candy-blue-leather-quilted-with-ivory-stitching-golf-headcovers	2024-11-02 23:49:54.113	2024-11-02 23:49:54.113	customizable
cm30tfltt00021496pzkqtwld	gid://shopify/Product/7563088101583	gid://shopify/ProductVariant/44023073636559	gid://shopify/InventoryItem/46137907970255	Quilted-CB-IS-7Wood	cm2nkaznh000613g4b2ocmg9n	cm2dw0v4h000c145dyla794mf	cm2duhfg300036y583y11e4k3	5.80	cm2cns61i000313hyqmcgyq0e	\N	cm2y536ji000y48z7qkxmkol3	cm2y27m1s000148z7lxqzsda5	\N	\N	candy-blue-leather-quilted-with-ivory-stitching-golf-headcovers	2024-11-02 23:49:54.112	2024-11-02 23:49:54.112	customizable
\.


--
-- Data for Name: ProductPrice; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."ProductPrice" (id, "shopifyPrice", "higherPrice", "shapeId", "createdAt", "updatedAt", "shopifyCollectionId") FROM stdin;
cm2kyjtlb000bol0jm8uzfx45	140.00	155.00	cm2duhfg300046y58o8dsmwzo	2024-10-22 21:28:50.059	2024-10-24 18:02:09.817	cm2nk5qi9000213g42b33wihd
cm2kyjtlb000col0ja8b1oy0v	135.00	150.00	cm2duhfg300056y58ddfbtcxj	2024-10-22 21:28:50.059	2024-10-24 18:02:09.817	cm2nk5qi9000213g42b33wihd
cm2kyjtlb000dol0j1kyhwc4a	150.00	165.00	cm2duhfg300066y583ii779yr	2024-10-22 21:28:50.059	2024-10-24 18:02:09.817	cm2nk5qi9000213g42b33wihd
cm2kyjtlb000eol0jdgcxko62	150.00	165.00	cm2duhfg300076y585owscoo4	2024-10-22 21:28:50.059	2024-10-24 18:02:09.817	cm2nk5qi9000213g42b33wihd
cm2kyjtlb000fol0jprtrx9it	160.00	175.00	cm2duhfg000006y58dqulghkm	2024-10-22 21:28:50.059	2024-10-24 18:02:09.817	cm2nkaznh000613g4b2ocmg9n
cm2kyjtl70000ol0je30h175b	140.00	155.00	cm2duhfg000006y58dqulghkm	2024-10-22 21:28:50.059	2024-10-24 18:02:09.817	cm2nk5qi8000113g4uutiklwy
cm2kyjtl90001ol0jfgnjy6wp	130.00	145.00	cm2duhfg300046y58o8dsmwzo	2024-10-22 21:28:50.059	2024-10-24 18:02:09.817	cm2nk5qi8000113g4uutiklwy
cm2kyjtl90002ol0j53txpoum	125.00	140.00	cm2duhfg300056y58ddfbtcxj	2024-10-22 21:28:50.059	2024-10-24 18:02:09.817	cm2nk5qi8000113g4uutiklwy
cm2kyjtl90003ol0ji92ocley	150.00	165.00	cm2duhfg300066y583ii779yr	2024-10-22 21:28:50.059	2024-10-24 18:02:09.817	cm2nk5qi8000113g4uutiklwy
cm2kyjtl90004ol0jhm1ppuul	150.00	165.00	cm2duhfg300076y585owscoo4	2024-10-22 21:28:50.059	2024-10-24 18:02:09.817	cm2nk5qi8000113g4uutiklwy
cm2kyjtla0005ol0javeroagp	145.00	160.00	cm2duhfg000006y58dqulghkm	2024-10-22 21:28:50.059	2024-10-24 18:02:09.817	cm2nk5qi9000513g4daix79qn
cm2kyjtla0006ol0jb32ak0js	135.00	150.00	cm2duhfg300046y58o8dsmwzo	2024-10-22 21:28:50.059	2024-10-24 18:02:09.817	cm2nk5qi9000513g4daix79qn
cm2kyjtla0007ol0jut6mx23b	130.00	145.00	cm2duhfg300056y58ddfbtcxj	2024-10-22 21:28:50.059	2024-10-24 18:02:09.817	cm2nk5qi9000513g4daix79qn
cm2kyjtla0008ol0jshg3vqyo	150.00	165.00	cm2duhfg300066y583ii779yr	2024-10-22 21:28:50.059	2024-10-24 18:02:09.817	cm2nk5qi9000513g4daix79qn
cm2kyjtla0009ol0jsyakarza	150.00	165.00	cm2duhfg300076y585owscoo4	2024-10-22 21:28:50.059	2024-10-24 18:02:09.817	cm2nk5qi9000513g4daix79qn
cm2kyjtlb000aol0jppzv7bqq	150.00	165.00	cm2duhfg000006y58dqulghkm	2024-10-22 21:28:50.059	2024-10-24 18:02:09.817	cm2nk5qi9000513g4daix79qn
cm2kyjtlc000gol0jx1g84lno	150.00	165.00	cm2duhfg300046y58o8dsmwzo	2024-10-22 21:28:50.059	2024-10-24 18:02:09.817	cm2nkaznh000613g4b2ocmg9n
cm2kyjtld000hol0jeejmmpw3	145.00	160.00	cm2duhfg300056y58ddfbtcxj	2024-10-22 21:28:50.059	2024-10-24 18:02:09.817	cm2nkaznh000613g4b2ocmg9n
cm2kyjtld000iol0j7dq8cqi5	160.00	175.00	cm2duhfg300066y583ii779yr	2024-10-22 21:28:50.059	2024-10-24 18:02:09.817	cm2nkaznh000613g4b2ocmg9n
cm2kyjtld000jol0j1060r0rg	160.00	175.00	cm2duhfg300076y585owscoo4	2024-10-22 21:28:50.059	2024-10-24 18:02:09.817	cm2nkaznh000613g4b2ocmg9n
cm2kyjtle000kol0j9odbhbpr	170.00	185.00	cm2duhfg000006y58dqulghkm	2024-10-22 21:28:50.059	2024-10-24 18:02:09.817	cm2nk5qi9000413g415csqbkq
cm2kyjtle000lol0jvkp60h1i	160.00	175.00	cm2duhfg300046y58o8dsmwzo	2024-10-22 21:28:50.059	2024-10-24 18:02:09.817	cm2nk5qi9000413g415csqbkq
cm2kyjtle000mol0j1px8krkx	155.00	170.00	cm2duhfg300056y58ddfbtcxj	2024-10-22 21:28:50.059	2024-10-24 18:02:09.817	cm2nk5qi9000413g415csqbkq
cm2kyjtle000nol0jskq9q10b	170.00	185.00	cm2duhfg300066y583ii779yr	2024-10-22 21:28:50.059	2024-10-24 18:02:09.817	cm2nk5qi9000413g415csqbkq
cm2kyjtle000ool0jkyfs6p07	170.00	185.00	cm2duhfg300076y585owscoo4	2024-10-22 21:28:50.059	2024-10-24 18:02:09.817	cm2nk5qi9000413g415csqbkq
\.


--
-- Data for Name: Session; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Session" (id, shop, state, "isOnline", scope, expires, "accessToken", "userId", "firstName", "lastName", email, "accountOwner", locale, collaborator, "emailVerified") FROM stdin;
offline_test-lpc-product.myshopify.com	test-lpc-product.myshopify.com		f	read_orders,write_fulfillments,write_inventory,write_products	\N	shpua_bfd181b669511bde4bc4d136eb0a157a	\N	\N	\N	\N	f	\N	f	f
\.


--
-- Data for Name: _EmbroideryThreadToTag; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."_EmbroideryThreadToTag" ("A", "B") FROM stdin;
cm2mblrjs0000rza90jsilvze	cm2dvxbki0000145djbebncw9
cm2mblrjv0008rza9zrlar9ef	cm2dvxbki0001145dj5azmbmp
cm2mblrjt0001rza9che6immo	cm2dvxbki0002145d6ugzphtp
cm2mebmoi0003tiahocybdf8z	cm2dvxbki0003145d6ns02rq9
cm2qgc1m5000f1g1dhnhm1qa1	cm2dvxbki0003145d6ns02rq9
cm2mblrjt0002rza9ygl9e1vs	cm2dvxbki0004145drl0lylfj
cm2mblrjs0000rza90jsilvze	cm2dvxbki0005145d3phoi7xo
cm2mebmoq0006tiahjkauvtal	cm2dvxbki0006145dt0o9ajvw
cm2mblrjv0006rza9taki52xq	cm2dvxbki0007145dm0cq0uhw
cm2mblrjs0000rza90jsilvze	cm2dvxbki0008145dt5iddlgw
cm2mblrjt0002rza9ygl9e1vs	cm2dvxbki0009145db6zdbkac
cm2mblrjs0000rza90jsilvze	cm2qgaof600001g1dz74jp579
cm2mblrjv0007rza97rb4gbuh	cm2qgaof600001g1dz74jp579
cm2qge50d000g1g1d6hnfclsq	cm2qgaof600011g1dp0u6h8rj
cm2qgc1m5000f1g1dhnhm1qa1	cm2qgaof600021g1dm3492c46
cm2mblrjt0002rza9ygl9e1vs	cm2qgaof600031g1diekivra8
cm2mblrju0003rza9kc0up31s	cm2qgaof600041g1d3ydxcw0k
cm2mblrju0003rza9kc0up31s	cm2qgaof600051g1dpktyh5ln
cm2mblrjv0006rza9taki52xq	cm2qgaof600061g1dlelq43ou
cm2mblrjt0002rza9ygl9e1vs	cm2qgaof600071g1dor51myoe
cm2mblrju0003rza9kc0up31s	cm2qgaof600071g1dor51myoe
cm2mebmoq0006tiahjkauvtal	cm2qgaof700081g1dvacvsfuy
cm2mblrjv0008rza9zrlar9ef	cm2qgaof700091g1dkc931kol
cm2mblrju0004rza94514jymr	cm2qgaof7000a1g1dvndqvxgt
cm2mblrjt0001rza9che6immo	cm2qgaof7000b1g1d58lej3q9
cm2mblrju0004rza94514jymr	cm2qgaof7000b1g1d58lej3q9
cm2qge50d000g1g1d6hnfclsq	cm2qgaof7000c1g1dp877zci4
cm2mblrju0005rza9a52q3dxa	cm2qgaof7000d1g1d381xj9o3
cm2mblrju0005rza9a52q3dxa	cm2qgaof7000e1g1dlkcw80ui
\.


--
-- Data for Name: _LeatherColorToTag; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."_LeatherColorToTag" ("A", "B") FROM stdin;
cm2mblrjs0000rza90jsilvze	cm2cns61i000413hy33aa3pud
cm2mblrjs0000rza90jsilvze	cm2cns61i000i13hyqtgjyuaz
cm2mblrjs0000rza90jsilvze	cm2cns61i000013hyeks31jrt
cm2mblrjt0001rza9che6immo	cm2cns61i000913hyhjn0hu9g
cm2mblrjt0002rza9ygl9e1vs	cm2cns61i000113hyzw654kd9
cm2mblrjt0002rza9ygl9e1vs	cm2cns61i000313hyqmcgyq0e
cm2mblrjt0002rza9ygl9e1vs	cm2cns61i000713hyrwhg9dif
cm2mblrjt0002rza9ygl9e1vs	cm2cns61i000a13hy1flrgnqb
cm2mblrjt0002rza9ygl9e1vs	cm2cns61i000e13hy950a9gtu
cm2mblrjt0002rza9ygl9e1vs	cm2cns61i000g13hy1kz542ba
cm2mblrjt0002rza9ygl9e1vs	cm2cns61j000l13hy976waddm
cm2mblrju0003rza9kc0up31s	cm2cns61i000813hyspmia8eq
cm2mblrju0003rza9kc0up31s	cm2cns61i000g13hy1kz542ba
cm2mblrju0003rza9kc0up31s	cm2cns61i000213hyi8jex0hf
cm2mblrju0004rza94514jymr	cm2cns61i000c13hy246fbglj
cm2mblrju0004rza94514jymr	cm2cns61j000j13hy64e5qirc
cm2mblrjv0006rza9taki52xq	cm2cns61i000b13hy49artt54
cm2mblrjv0007rza97rb4gbuh	cm2cns61i000013hyeks31jrt
cm2mblrjv0008rza9zrlar9ef	cm2cns61i000d13hyl60ce9kw
cm2mblrjv0008rza9zrlar9ef	cm2cns61i000h13hyt01sr3py
cm2mblrjv0008rza9zrlar9ef	cm2cns61j000k13hyw9zokpoo
cm2mblrjv0008rza9zrlar9ef	cm2cns61j000m13hyebmzwi47
cm2qge50d000g1g1d6hnfclsq	cm2cns61i000013hyeks31jrt
cm2mblrjs0000rza90jsilvze	cm2qgxtxc000h1g1d0oojrfn1
cm2mblrjt0001rza9che6immo	cm2qgxtxc000i1g1dbi0p3ux9
cm2mblrjs0000rza90jsilvze	cm2qgxtxc000j1g1dovq0j7ei
cm2mblrjv0007rza97rb4gbuh	cm2qgxtxc000j1g1dovq0j7ei
cm2mblrjv0008rza9zrlar9ef	cm2qgxtxd000l1g1dy5o1gbu5
cm2mebmoq0006tiahjkauvtal	cm2cns61i000613hyeqj54zrz
\.


--
-- Data for Name: _StitchingThreadToTag; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."_StitchingThreadToTag" ("A", "B") FROM stdin;
cm2mblrjs0000rza90jsilvze	cm2dvxbki0000145djbebncw9
cm2mblrjv0008rza9zrlar9ef	cm2dvxbki0001145dj5azmbmp
cm2mblrjt0001rza9che6immo	cm2dvxbki0002145d6ugzphtp
cm2mebmoi0003tiahocybdf8z	cm2dvxbki0003145d6ns02rq9
cm2qgc1m5000f1g1dhnhm1qa1	cm2dvxbki0003145d6ns02rq9
cm2mblrjt0002rza9ygl9e1vs	cm2dvxbki0004145drl0lylfj
cm2mblrjs0000rza90jsilvze	cm2dvxbki0005145d3phoi7xo
cm2mebmoq0006tiahjkauvtal	cm2dvxbki0006145dt0o9ajvw
cm2mblrjv0006rza9taki52xq	cm2dvxbki0007145dm0cq0uhw
cm2mblrjs0000rza90jsilvze	cm2dvxbki0008145dt5iddlgw
cm2mblrjt0002rza9ygl9e1vs	cm2dvxbki0009145db6zdbkac
cm2mblrjs0000rza90jsilvze	cm2qgaof600001g1dz74jp579
cm2mblrjv0007rza97rb4gbuh	cm2qgaof600001g1dz74jp579
cm2qge50d000g1g1d6hnfclsq	cm2qgaof600011g1dp0u6h8rj
cm2qgc1m5000f1g1dhnhm1qa1	cm2qgaof600021g1dm3492c46
cm2mblrjt0002rza9ygl9e1vs	cm2qgaof600031g1diekivra8
cm2mblrju0003rza9kc0up31s	cm2qgaof600041g1d3ydxcw0k
cm2mblrju0003rza9kc0up31s	cm2qgaof600051g1dpktyh5ln
cm2mblrjv0006rza9taki52xq	cm2qgaof600061g1dlelq43ou
cm2mblrjt0002rza9ygl9e1vs	cm2qgaof600071g1dor51myoe
cm2mblrju0003rza9kc0up31s	cm2qgaof600071g1dor51myoe
cm2mebmoq0006tiahjkauvtal	cm2qgaof700081g1dvacvsfuy
cm2mblrjv0008rza9zrlar9ef	cm2qgaof700091g1dkc931kol
cm2mblrju0004rza94514jymr	cm2qgaof7000a1g1dvndqvxgt
cm2mblrjt0001rza9che6immo	cm2qgaof7000b1g1d58lej3q9
cm2mblrju0004rza94514jymr	cm2qgaof7000b1g1d58lej3q9
cm2qge50d000g1g1d6hnfclsq	cm2qgaof7000c1g1dp877zci4
cm2mblrju0005rza9a52q3dxa	cm2qgaof7000d1g1d381xj9o3
cm2mblrju0005rza9a52q3dxa	cm2qgaof7000e1g1dlkcw80ui
cm2mblrjt0002rza9ygl9e1vs	cm2y52hv2000t48z7j51a8quq
cm2qge50d000g1g1d6hnfclsq	cm2y52hv2000u48z7ckvo0gmh
cm2mblrjs0000rza90jsilvze	cm2y52hv2000v48z70i2w0z05
cm2mblrju0004rza94514jymr	cm2y52hv2000v48z70i2w0z05
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
86458d1e-e8b0-4757-881c-fe73cbdaadda	c597a28f9638ecf08b82c0b43ff8a7a0c165619e49260c916be5a6d870dbdcea	2024-10-26 14:42:59.967402-07	20241016222946_init	\N	\N	2024-10-26 14:42:59.964687-07	1
c33adc02-4986-40e9-94e1-eb38fd250d83	06dd58fc327e6902eed34854da0d032e578ffd9658f9f318d71136eed42cd685	2024-10-26 14:51:42.608504-07	20241026215142_remove_thread_table	\N	\N	2024-10-26 14:51:42.604664-07	1
974c7b9b-8390-4bda-9c35-1b7f6d3fed1f	7ce603a720c92f84e70e45c98122923b7172c8f524c2645c6f4941f233493555	2024-10-26 14:42:59.969883-07	20241017012252_init	\N	\N	2024-10-26 14:42:59.967824-07	1
6c1b2412-15a3-4915-9471-93cc43e2f10f	d06b048aedc8e30760adae96ef30be09f05080ee26d72efdf93c239ea7254b81	2024-10-26 14:42:59.973323-07	20241017021338_add_new_models	\N	\N	2024-10-26 14:42:59.970285-07	1
9d5c02b3-b6f4-4169-bb97-10852965ba4e	a2dafddbb7e41570f77153f5b2e1ef94aaca87955158ec0f60b38c3eb60cb2d3	2024-10-26 14:42:59.974426-07	20241017021643_update_field_types	\N	\N	2024-10-26 14:42:59.973732-07	1
35570d15-97fc-4bf4-83e5-2fa60d3fb878	7317c206323070ed56310bd06902fb924c063d2f3f0e10fa46b5921324a33334	2024-10-26 14:53:33.229073-07	20241026215333_added_is_limited_edition_leather	\N	\N	2024-10-26 14:53:33.227608-07	1
86c07774-d433-4c5c-866c-555134499942	587d935c66f03b4b56b3c8ccf54502dd31e1a30dcd7e42cdb64fa38cbad76ec1	2024-10-26 14:42:59.977868-07	20241017223608_add_font_thread	\N	\N	2024-10-26 14:42:59.974876-07	1
352f41b6-cc9c-418b-b989-d70484bfe93a	4cf2eb0c092fc62e59ab87324c5c73e36da9f8177c5d6271c1803cf5b4f970fb	2024-10-26 14:42:59.979383-07	20241019164541_shape_abbreviation	\N	\N	2024-10-26 14:42:59.97851-07	1
1aaa1ebc-e5f4-476e-b560-b8ef9fe94b9a	04ffaa7542a3b03a251eeeb78c3a4536756ed2898056de0613b65a3f11927282	2024-10-26 14:42:59.983571-07	20241022200950_add_pricing_collections	\N	\N	2024-10-26 14:42:59.979855-07	1
1097a391-1606-4f65-839a-ada359736a0e	5cb3d420fa2c9cc2335bbfa298e0cd5d30762dbd72076cac7f2015a3f3755462	2024-10-31 18:18:35.260863-07	20241101011835_add_thread_number_tables	\N	\N	2024-10-31 18:18:35.253803-07	1
dc779da9-fb3e-4176-ac17-799da944e284	2259ee6fd576e12c030e3cd18e509439c852b8d8e80174ea56716f838c6caa47	2024-10-26 14:42:59.987475-07	20241023200746_add_color_tags	\N	\N	2024-10-26 14:42:59.983972-07	1
3f97851a-e47e-47c0-9968-f5d37a1e66aa	2dbc0aadde95bc873a49e07ef23c5c366ec08d6e898bc71b7a18424e677a1b89	2024-10-26 14:42:59.990087-07	20241023205935_add_color_tags_to_threads	\N	\N	2024-10-26 14:42:59.987843-07	1
5761314b-1489-446b-acf2-c0b012abd709	f34b4bd47a4a9df63d22e1b4bfc137ce6f78d6a829333b00ca7800e08c2b65dd	2024-10-26 14:42:59.993082-07	20241024163322_add_nullable_collection_relation	\N	\N	2024-10-26 14:42:59.99052-07	1
35605963-1c44-48d0-bde6-73637d4e13e6	4221ca68efadcce4fb2d4a19602144cacff437a486dd059024e5c2214a8e0709	2024-11-01 16:00:37.076212-07	20241101230037_add_product_data_lpc	\N	\N	2024-11-01 16:00:37.066774-07	1
99b9ab9b-1fa4-4d7e-a391-3090b96ccc76	3e8a8a1af3df1cec608b37a530d16a2b6d86cbd8ce9b7c26e32a13ea01bb71a2	2024-10-26 14:42:59.994152-07	20241024170307_add_admin_graphql_api_id	\N	\N	2024-10-26 14:42:59.993386-07	1
a73b5b52-7d8f-475d-ae79-9e2678162d3f	add41d73ec18a5c70f629ca00883f45f945d008bbc1de6b4863155944fb2b9c2	2024-10-26 14:42:59.998285-07	20241024173445_rename_shopify_collections	\N	\N	2024-10-26 14:42:59.994506-07	1
4d3347a1-eece-4faf-883d-0054f975af0e	b3dae6219bb50951ed03532ff41ab33cf47f691efa25cb099948567c8713e4d0	2024-10-26 14:43:00.006765-07	20241026205619_split_thread_tables	\N	\N	2024-10-26 14:42:59.998633-07	1
b1b0ab09-de15-48f1-b0d2-b287d58afdef	a87794d90e31402d6695ca178f954fa8fef5ba55a656056e7a4e3269101839fa	2024-11-02 16:34:48.983128-07	20241102233448_rename_product_type_column_to_offering_type	\N	\N	2024-11-02 16:34:48.98165-07	1
\.


--
-- PostgreSQL database dump complete
--

