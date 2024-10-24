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
-- Name: public; Type: SCHEMA; Schema: -; Owner: postgres
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO postgres;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: postgres
--

COMMENT ON SCHEMA public IS '';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: ColorTag; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."ColorTag" (
    id text NOT NULL,
    name text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."ColorTag" OWNER TO postgres;

--
-- Name: Font; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Font" (
    id text NOT NULL,
    name text NOT NULL,
    image_url text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Font" OWNER TO postgres;

--
-- Name: LeatherColor; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."LeatherColor" (
    id text NOT NULL,
    name text NOT NULL,
    abbreviation text NOT NULL,
    image_url text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."LeatherColor" OWNER TO postgres;

--
-- Name: ProductPrice; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."ProductPrice" (
    id text NOT NULL,
    "shopifyPrice" numeric(10,2) NOT NULL,
    "higherPrice" numeric(10,2) NOT NULL,
    "shapeId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "shopifyCollectionId" text
);


ALTER TABLE public."ProductPrice" OWNER TO postgres;

--
-- Name: Session; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Session" (
    id text NOT NULL,
    shop text NOT NULL,
    state text NOT NULL,
    "isOnline" boolean DEFAULT false NOT NULL,
    scope text,
    expires timestamp(3) without time zone,
    "accessToken" text NOT NULL,
    "userId" bigint,
    "firstName" text,
    "lastName" text,
    email text,
    "accountOwner" boolean DEFAULT false NOT NULL,
    locale text,
    collaborator boolean DEFAULT false,
    "emailVerified" boolean DEFAULT false
);


ALTER TABLE public."Session" OWNER TO postgres;

--
-- Name: Shape; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Shape" (
    id text NOT NULL,
    name text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    abbreviation text
);


ALTER TABLE public."Shape" OWNER TO postgres;

--
-- Name: ShopifyCollections; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."ShopifyCollections" (
    id text NOT NULL,
    "shopifyId" text NOT NULL,
    title text NOT NULL,
    handle text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    admin_graphql_api_id text NOT NULL
);


ALTER TABLE public."ShopifyCollections" OWNER TO postgres;

--
-- Name: Style; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Style" (
    id text NOT NULL,
    name text NOT NULL,
    abbreviation text NOT NULL,
    image_url text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Style" OWNER TO postgres;

--
-- Name: Thread; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Thread" (
    id text NOT NULL,
    name text NOT NULL,
    abbreviation text NOT NULL,
    amann_number text,
    isacord_number text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Thread" OWNER TO postgres;

--
-- Name: _LeatherColorToTag; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."_LeatherColorToTag" (
    "A" text NOT NULL,
    "B" text NOT NULL
);


ALTER TABLE public."_LeatherColorToTag" OWNER TO postgres;

--
-- Name: _ThreadColorToTag; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."_ThreadColorToTag" (
    "A" text NOT NULL,
    "B" text NOT NULL
);


ALTER TABLE public."_ThreadColorToTag" OWNER TO postgres;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO postgres;

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
cm2mebmo30000tiahy6ojhlnu	Dark Chocolate	2024-10-23 21:38:07.875	2024-10-23 21:38:07.875
cm2mebmob0001tiahntejewdn	Ivory	2024-10-23 21:38:07.884	2024-10-23 21:38:07.884
cm2mebmoi0003tiahocybdf8z	Gold	2024-10-23 21:38:07.89	2024-10-23 21:38:07.89
cm2mebmol0004tiahr0z9rvbg	Navy	2024-10-23 21:38:07.894	2024-10-23 21:38:07.894
cm2mebmon0005tiahf8avp5pv	Burbon	2024-10-23 21:38:07.896	2024-10-23 21:38:07.896
cm2mebmoq0006tiahjkauvtal	Hot Pink	2024-10-23 21:38:07.899	2024-10-23 21:38:07.899
cm2mebmot0007tiaha6xezr9y	Crimson	2024-10-23 21:38:07.901	2024-10-23 21:38:07.901
cm2mebmov0008tiah9tlhwbum	Cinnamon	2024-10-23 21:38:07.904	2024-10-23 21:38:07.904
cm2mebmox0009tiahcm9z5e4z	Royal Blue	2024-10-23 21:38:07.905	2024-10-23 21:38:07.905
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
-- Data for Name: LeatherColor; Type: TABLE DATA; Schema: public; Owner: postgres
--

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
offline_lpc-product-creation.myshopify.com	lpc-product-creation.myshopify.com		f	read_orders,write_products	\N	shpua_108e6399798f3be3d4bd3a56e20f07a9	\N	\N	\N	\N	f	\N	f	f
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
-- Data for Name: Thread; Type: TABLE DATA; Schema: public; Owner: postgres
--

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


--
-- Data for Name: _ThreadColorToTag; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."_ThreadColorToTag" ("A", "B") FROM stdin;
cm2mebmo30000tiahy6ojhlnu	cm2dvxbki0000145djbebncw9
cm2mebmob0001tiahntejewdn	cm2dvxbki0001145dj5azmbmp
cm2mblrjt0001rza9che6immo	cm2dvxbki0002145d6ugzphtp
cm2mebmoi0003tiahocybdf8z	cm2dvxbki0003145d6ns02rq9
cm2mebmol0004tiahr0z9rvbg	cm2dvxbki0004145drl0lylfj
cm2mebmon0005tiahf8avp5pv	cm2dvxbki0005145d3phoi7xo
cm2mebmoq0006tiahjkauvtal	cm2dvxbki0006145dt0o9ajvw
cm2mebmot0007tiaha6xezr9y	cm2dvxbki0007145dm0cq0uhw
cm2mebmov0008tiah9tlhwbum	cm2dvxbki0008145dt5iddlgw
cm2mebmox0009tiahcm9z5e4z	cm2dvxbki0009145db6zdbkac
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
dd0adcb1-4326-4001-beba-e3dd56076de6	c597a28f9638ecf08b82c0b43ff8a7a0c165619e49260c916be5a6d870dbdcea	2024-10-23 14:34:44.043059-07	20241016222946_init	\N	\N	2024-10-23 14:34:44.041474-07	1
f5c099b7-a0b1-4cb8-af2b-95eac0742821	7ce603a720c92f84e70e45c98122923b7172c8f524c2645c6f4941f233493555	2024-10-23 14:34:44.044972-07	20241017012252_init	\N	\N	2024-10-23 14:34:44.043381-07	1
5fb13560-a0e2-4713-89e1-53581dadfa8e	d06b048aedc8e30760adae96ef30be09f05080ee26d72efdf93c239ea7254b81	2024-10-23 14:34:44.047795-07	20241017021338_add_new_models	\N	\N	2024-10-23 14:34:44.045258-07	1
7902e106-a242-47cd-b1e8-7c1910be77dc	a2dafddbb7e41570f77153f5b2e1ef94aaca87955158ec0f60b38c3eb60cb2d3	2024-10-23 14:34:44.048783-07	20241017021643_update_field_types	\N	\N	2024-10-23 14:34:44.048198-07	1
6cc640c6-293d-477a-b509-22d77dfc94ed	587d935c66f03b4b56b3c8ccf54502dd31e1a30dcd7e42cdb64fa38cbad76ec1	2024-10-23 14:34:44.051075-07	20241017223608_add_font_thread	\N	\N	2024-10-23 14:34:44.048948-07	1
5b232986-db48-4d14-aa24-2637a5fca1ec	4cf2eb0c092fc62e59ab87324c5c73e36da9f8177c5d6271c1803cf5b4f970fb	2024-10-23 14:34:44.051742-07	20241019164541_shape_abbreviation	\N	\N	2024-10-23 14:34:44.051281-07	1
2252f774-f6a8-47bf-8469-f006bf8363ce	04ffaa7542a3b03a251eeeb78c3a4536756ed2898056de0613b65a3f11927282	2024-10-23 14:34:44.054123-07	20241022200950_add_pricing_collections	\N	\N	2024-10-23 14:34:44.051899-07	1
59fbea76-af43-4ca0-98d9-a66755cb9c63	2259ee6fd576e12c030e3cd18e509439c852b8d8e80174ea56716f838c6caa47	2024-10-23 14:34:44.056984-07	20241023200746_add_color_tags	\N	\N	2024-10-23 14:34:44.054322-07	1
03261af7-d4f9-4f84-8f4a-320709100508	2dbc0aadde95bc873a49e07ef23c5c366ec08d6e898bc71b7a18424e677a1b89	2024-10-23 14:34:44.06298-07	20241023205935_add_color_tags_to_threads	\N	\N	2024-10-23 14:34:44.057275-07	1
6385e681-02b7-4b14-94d5-6ed5b159ce6a	c597a28f9638ecf08b82c0b43ff8a7a0c165619e49260c916be5a6d870dbdcea	2024-10-16 18:22:34.884593-07	20241016222946_init	\N	\N	2024-10-16 18:22:34.880614-07	1
0fddb3f3-e4c4-465d-ba52-f44656d474a1	f34b4bd47a4a9df63d22e1b4bfc137ce6f78d6a829333b00ca7800e08c2b65dd	2024-10-24 09:33:22.403378-07	20241024163322_add_nullable_collection_relation	\N	\N	2024-10-24 09:33:22.397773-07	1
9754a80f-8b54-4d9d-900c-285199101bd9	3e8a8a1af3df1cec608b37a530d16a2b6d86cbd8ce9b7c26e32a13ea01bb71a2	2024-10-24 10:03:07.663271-07	20241024170307_add_admin_graphql_api_id	\N	\N	2024-10-24 10:03:07.661435-07	1
70900b19-bfc4-49a9-b6ff-9f59d409b713	add41d73ec18a5c70f629ca00883f45f945d008bbc1de6b4863155944fb2b9c2	2024-10-24 10:34:45.452951-07	20241024173445_rename_shopify_collections	\N	\N	2024-10-24 10:34:45.446925-07	1
\.


--
-- Name: ColorTag ColorTag_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ColorTag"
    ADD CONSTRAINT "ColorTag_pkey" PRIMARY KEY (id);


--
-- Name: Font Font_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Font"
    ADD CONSTRAINT "Font_pkey" PRIMARY KEY (id);


--
-- Name: LeatherColor LeatherColor_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."LeatherColor"
    ADD CONSTRAINT "LeatherColor_pkey" PRIMARY KEY (id);


--
-- Name: ProductPrice ProductPrice_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ProductPrice"
    ADD CONSTRAINT "ProductPrice_pkey" PRIMARY KEY (id);


--
-- Name: Session Session_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Session"
    ADD CONSTRAINT "Session_pkey" PRIMARY KEY (id);


--
-- Name: Shape Shape_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Shape"
    ADD CONSTRAINT "Shape_pkey" PRIMARY KEY (id);


--
-- Name: ShopifyCollections ShopifyCollections_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ShopifyCollections"
    ADD CONSTRAINT "ShopifyCollections_pkey" PRIMARY KEY (id);


--
-- Name: Style Style_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Style"
    ADD CONSTRAINT "Style_pkey" PRIMARY KEY (id);


--
-- Name: Thread Thread_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Thread"
    ADD CONSTRAINT "Thread_pkey" PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: ColorTag_name_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "ColorTag_name_key" ON public."ColorTag" USING btree (name);


--
-- Name: ShopifyCollections_handle_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "ShopifyCollections_handle_key" ON public."ShopifyCollections" USING btree (handle);


--
-- Name: _LeatherColorToTag_AB_unique; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "_LeatherColorToTag_AB_unique" ON public."_LeatherColorToTag" USING btree ("A", "B");


--
-- Name: _LeatherColorToTag_B_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "_LeatherColorToTag_B_index" ON public."_LeatherColorToTag" USING btree ("B");


--
-- Name: _ThreadColorToTag_AB_unique; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "_ThreadColorToTag_AB_unique" ON public."_ThreadColorToTag" USING btree ("A", "B");


--
-- Name: _ThreadColorToTag_B_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "_ThreadColorToTag_B_index" ON public."_ThreadColorToTag" USING btree ("B");


--
-- Name: ProductPrice ProductPrice_shapeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ProductPrice"
    ADD CONSTRAINT "ProductPrice_shapeId_fkey" FOREIGN KEY ("shapeId") REFERENCES public."Shape"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ProductPrice ProductPrice_shopifyCollectionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ProductPrice"
    ADD CONSTRAINT "ProductPrice_shopifyCollectionId_fkey" FOREIGN KEY ("shopifyCollectionId") REFERENCES public."ShopifyCollections"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: _LeatherColorToTag _LeatherColorToTag_A_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."_LeatherColorToTag"
    ADD CONSTRAINT "_LeatherColorToTag_A_fkey" FOREIGN KEY ("A") REFERENCES public."ColorTag"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: _LeatherColorToTag _LeatherColorToTag_B_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."_LeatherColorToTag"
    ADD CONSTRAINT "_LeatherColorToTag_B_fkey" FOREIGN KEY ("B") REFERENCES public."LeatherColor"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: _ThreadColorToTag _ThreadColorToTag_A_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."_ThreadColorToTag"
    ADD CONSTRAINT "_ThreadColorToTag_A_fkey" FOREIGN KEY ("A") REFERENCES public."ColorTag"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: _ThreadColorToTag _ThreadColorToTag_B_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."_ThreadColorToTag"
    ADD CONSTRAINT "_ThreadColorToTag_B_fkey" FOREIGN KEY ("B") REFERENCES public."Thread"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: postgres
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- PostgreSQL database dump complete
--

