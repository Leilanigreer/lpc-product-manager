--
-- PostgreSQL database dump
--

-- Dumped from database version 17.2 (Postgres.app)
-- Dumped by pg_dump version 17.3 (Homebrew)

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


--
-- Name: ShapeType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."ShapeType" AS ENUM (
    'WOOD',
    'PUTTER',
    'OTHER',
    'DRIVER',
    'HYBRID'
);


ALTER TYPE public."ShapeType" OWNER TO postgres;

--
-- Name: StyleNamePattern; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."StyleNamePattern" AS ENUM (
    'STANDARD',
    'STYLE_FIRST',
    'CUSTOM'
);


ALTER TYPE public."StyleNamePattern" OWNER TO postgres;

--
-- Name: ThreadType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."ThreadType" AS ENUM (
    'EMBROIDERY',
    'STITCHING',
    'NONE'
);


ALTER TYPE public."ThreadType" OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: AmannNumber; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."AmannNumber" (
    id text NOT NULL,
    number text NOT NULL,
    "threadId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."AmannNumber" OWNER TO postgres;

--
-- Name: CollectionTitleFormat; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."CollectionTitleFormat" (
    id text NOT NULL,
    "collectionId" text NOT NULL,
    "titleTemplate" text NOT NULL,
    "seoTemplate" text NOT NULL,
    "handleTemplate" text NOT NULL,
    validation jsonb NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."CollectionTitleFormat" OWNER TO postgres;

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
-- Name: CommonDescription; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."CommonDescription" (
    id text NOT NULL,
    name text NOT NULL,
    content text NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."CommonDescription" OWNER TO postgres;

--
-- Name: EmbroideryThread; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."EmbroideryThread" (
    id text NOT NULL,
    name text NOT NULL,
    abbreviation text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."EmbroideryThread" OWNER TO postgres;

--
-- Name: Font; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Font" (
    id text NOT NULL,
    name text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    url_id text
);


ALTER TABLE public."Font" OWNER TO postgres;

--
-- Name: IsacordNumber; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."IsacordNumber" (
    id text NOT NULL,
    number text NOT NULL,
    "threadId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "isStockThread" boolean DEFAULT false NOT NULL,
    "wawakColorName" text,
    "wawakItemNumber" text
);


ALTER TABLE public."IsacordNumber" OWNER TO postgres;

--
-- Name: LeatherColor; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."LeatherColor" (
    id text NOT NULL,
    name text NOT NULL,
    abbreviation text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "isLimitedEditionLeather" boolean DEFAULT false NOT NULL,
    url_id text
);


ALTER TABLE public."LeatherColor" OWNER TO postgres;

--
-- Name: PriceTier; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."PriceTier" (
    id text NOT NULL,
    name text NOT NULL,
    "shopifyPrice" numeric(10,2) NOT NULL,
    "marketplacePrice" numeric(10,2) NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."PriceTier" OWNER TO postgres;

--
-- Name: ProductDataLPC; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."ProductDataLPC" (
    id text NOT NULL,
    "shopifyProductId" text NOT NULL,
    "shopifyVariantId" text NOT NULL,
    "shopifyInventoryId" text NOT NULL,
    "SKU" text NOT NULL,
    "collectionId" text NOT NULL,
    "fontId" text NOT NULL,
    "shapeId" text NOT NULL,
    weight numeric(10,2) NOT NULL,
    "leatherColor1Id" text NOT NULL,
    "leatherColor2Id" text,
    "styleId" text,
    "mainHandle" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "offeringType" text NOT NULL,
    "baseSKU" text,
    "colorDesignationId" text,
    "embroideryThreadId" text,
    "isacordId" text
);


ALTER TABLE public."ProductDataLPC" OWNER TO postgres;

--
-- Name: ProductStitching; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."ProductStitching" (
    id text NOT NULL,
    "productDataLPCId" text NOT NULL,
    "stitchingThreadId" text NOT NULL,
    "amannId" text NOT NULL
);


ALTER TABLE public."ProductStitching" OWNER TO postgres;

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
    abbreviation text,
    "displayOrder" integer DEFAULT 0 NOT NULL,
    "shapeType" public."ShapeType" DEFAULT 'OTHER'::public."ShapeType" NOT NULL
);


ALTER TABLE public."Shape" OWNER TO postgres;

--
-- Name: ShapeTypeAdjustment; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."ShapeTypeAdjustment" (
    id text NOT NULL,
    "tierId" text NOT NULL,
    "shapeType" public."ShapeType" NOT NULL,
    "shopifyAdjustment" numeric(10,2) NOT NULL,
    "marketAdjustment" numeric(10,2) NOT NULL,
    "isBasePrice" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."ShapeTypeAdjustment" OWNER TO postgres;

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
    admin_graphql_api_id text NOT NULL,
    "showInDropdown" boolean DEFAULT true NOT NULL,
    "needsSecondaryLeather" boolean DEFAULT false NOT NULL,
    "needsStitchingColor" boolean DEFAULT false NOT NULL,
    "needsStyle" boolean DEFAULT false NOT NULL,
    "commonDescription" boolean DEFAULT true NOT NULL,
    description text,
    "threadType" public."ThreadType" DEFAULT 'NONE'::public."ThreadType" NOT NULL,
    "needsColorDesignation" boolean DEFAULT false NOT NULL,
    "skuPattern" text,
    "defaultStyleNamePattern" public."StyleNamePattern" DEFAULT 'STANDARD'::public."StyleNamePattern" NOT NULL,
    "stylePerCollection" boolean DEFAULT false NOT NULL,
    "priceTierId" text
);


ALTER TABLE public."ShopifyCollections" OWNER TO postgres;

--
-- Name: StitchingThread; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."StitchingThread" (
    id text NOT NULL,
    name text NOT NULL,
    abbreviation text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."StitchingThread" OWNER TO postgres;

--
-- Name: Style; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Style" (
    id text NOT NULL,
    name text NOT NULL,
    abbreviation text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "leatherPhrase" text,
    "useOppositeLeather" boolean DEFAULT false NOT NULL,
    "customNamePattern" text,
    "namePattern" public."StyleNamePattern" DEFAULT 'STANDARD'::public."StyleNamePattern" NOT NULL,
    url_id text
);


ALTER TABLE public."Style" OWNER TO postgres;

--
-- Name: StyleCollection; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."StyleCollection" (
    id text NOT NULL,
    "styleId" text NOT NULL,
    "collectionId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "overrideSecondaryLeather" boolean,
    "overrideStitchingColor" boolean,
    "handleTemplate" text,
    "seoTemplate" text,
    "titleTemplate" text,
    validation jsonb,
    "overrideColorDesignation" boolean,
    "skuPattern" text,
    "overrideCustomNamePattern" text,
    "overrideNamePattern" public."StyleNamePattern"
);


ALTER TABLE public."StyleCollection" OWNER TO postgres;

--
-- Name: _EmbroideryThreadToTag; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."_EmbroideryThreadToTag" (
    "A" text NOT NULL,
    "B" text NOT NULL
);


ALTER TABLE public."_EmbroideryThreadToTag" OWNER TO postgres;

--
-- Name: _LeatherColorToTag; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."_LeatherColorToTag" (
    "A" text NOT NULL,
    "B" text NOT NULL
);


ALTER TABLE public."_LeatherColorToTag" OWNER TO postgres;

--
-- Name: _StitchingThreadToTag; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."_StitchingThreadToTag" (
    "A" text NOT NULL,
    "B" text NOT NULL
);


ALTER TABLE public."_StitchingThreadToTag" OWNER TO postgres;

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
-- Data for Name: CollectionTitleFormat; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."CollectionTitleFormat" (id, "collectionId", "titleTemplate", "seoTemplate", "handleTemplate", validation, "createdAt", "updatedAt") FROM stdin;
cm5ee63ns00017d2e8yywj1dt	cm2nk5qi9000213g42b33wihd	{leatherColors.primary.label} and {leatherColors.secondary.label} Leather with {stitchingThreads.[0].label} Stitching	{title} Argyle Golf Headcovers	{tempMainHandle}-argyle-golf-headcovers	{"required": ["leatherColors.primary", "leatherColors.secondary", "stitchingThreads"], "errorMessages": {"stitchingThreads": "Stitching color missing", "leatherColors.primary": "Primary leather color missing", "leatherColors.secondary": "Secondary leather color missing"}}	2025-01-01 21:10:47.557	2025-01-17 18:24:58.376
cm5ee63ns00027d2eocn4ul07	cm2nk5qi9000413g415csqbkq	{leatherColors.primary.label} and {leatherColors.secondary.label} Leather Quilted	{title} Quilted Golf Headcovers	{tempMainHandle}-quilted-golf-headcovers	{"required": ["leatherColors.primary", "leatherColors.secondary"], "errorMessages": {"leatherColors.primary": "Primary leather color missing", "leatherColors.secondary": "Secondary leather color missing"}}	2025-01-01 21:10:47.557	2025-01-17 18:24:58.376
cm5ee63nt00037d2ebp56wmrs	cm2nk5qi9000513g4daix79qn	{leatherColors.primary.label} with {leatherColors.secondary.label} Leather	{title} Golf Headcovers	{tempMainHandle}-golf-headcovers	{"required": ["leatherColors.primary", "leatherColors.secondary"], "errorMessages": {"leatherColors.primary": "Primary leather color missing", "leatherColors.secondary": "Secondary leather color missing"}}	2025-01-01 21:10:47.557	2025-01-17 18:24:58.376
cm5ee63nt00047d2e69ub1d97	cm2nkaznh000613g4b2ocmg9n	{leatherColors.primary.label} Leather Quilted with {globalEmbroideryThread.label} Stitching	{title} Golf Headcovers	{tempMainHandle}-golf-headcovers	{"required": ["leatherColors.primary", "globalEmbroideryThread"], "errorMessages": {"leatherColors.primary": "Primary leather color missing", "globalEmbroideryThread": "Stitching color missing"}}	2025-01-01 21:10:47.557	2025-01-17 18:24:58.376
cm5ee63nq00007d2enunnfarq	cm2nk5qi8000113g4uutiklwy	{leatherColors.primary.label} with {leatherColors.secondary.label} Leather	{title} Golf Headcovers	{tempMainHandle}-golf-headcovers	{"required": ["leatherColors.primary", "leatherColors.secondary"], "errorMessages": {"leatherColors.primary": "Primary leather color missing", "leatherColors.secondary": "Secondary leather color missing"}}	2025-01-01 21:10:47.557	2025-01-17 21:47:50.108
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
-- Data for Name: CommonDescription; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."CommonDescription" (id, name, content, "isActive", "createdAt", "updatedAt") FROM stdin;
cm5e9ypc000001e1kqmyief61	leather_description	We use 100% top grain genuine cowhide from the finest tanneries in Italy, Argentina, and Austria, ensuring exceptional quality, luxurious feel, and unmatched durability. Every piece is hand cut by an artisan leather craftsman in the heart of downtown San Francisco, CA. If you don't see your ideal color combination, <a href='https://lpcgolf.com/pages/contact' target='_blank' title='Contact LPC golf' rel='noopener'>please contact us</a> about creating a custom, one-of-a-kind set.	t	2025-01-01 19:13:03.936	2025-01-03 16:19:56.879
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

COPY public."Font" (id, name, "createdAt", "updatedAt", url_id) FROM stdin;
cm5bxylo9000lop7vvl7n7uzg	Block Driver, Serif Fairways, Los Angeles H	2024-12-31 04:01:31.45	2024-12-31 04:01:09.687	\N
cm2dw0v4h000a145doemuo7c1	Block	2024-10-17 22:43:43.122	2025-01-16 03:55:49.454	1T7LRXF-pqm7Wg0PlD6C3lPrabQbegguL
cm2dw0v4h000b145d70dzv395	Gothic	2024-10-17 22:43:43.122	2025-01-16 04:00:31.889	1SN3l-VTGEtTLdWUh5UWSoLdSJ5XEfsQa
cm2dw0v4h000c145dyla794mf	Los Angeles	2024-10-17 22:43:43.122	2025-01-16 04:00:31.889	15hhiO0rMsExIACZYmEtvGz1n43mDNuzM
cm2dw0v4h000d145d7gnug20z	San Diego	2024-10-17 22:43:43.122	2025-01-16 04:00:31.889	165en1xBa3Nei-_2BYr7CUv9RIM0ewlxm
cm2dw0v4h000e145d6aof3d2i	Serif	2024-10-17 22:43:43.122	2025-01-16 04:00:31.889	1zCfxQzXeBb_gBNQhTaz3KoIlsJRugDg-
cm2dw0v4h000f145dz3h6i58o	Saipan	2024-10-17 22:43:43.122	2025-01-16 04:00:31.889	1HkKc8sRiQef72wURoBHyW65NCE5Krs0V
cm2dw0v4h000g145d0v6tpp72	Calgary	2024-10-17 22:43:43.122	2025-01-16 04:00:31.889	1ILWYdrgj8kh4rRXNdxcZoP0g-7iHmLGm
\.


--
-- Data for Name: IsacordNumber; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."IsacordNumber" (id, number, "threadId", "createdAt", "updatedAt", "isStockThread", "wawakColorName", "wawakItemNumber") FROM stdin;
cm79gjmow0001kqqkkzw97sgl	1346	cm2dvxbki0000145djbebncw9	2025-02-17 19:37:51.776	2025-02-17 19:37:51.776	t	Cinnamon	\N
cm79gjmoy0003kqqktd0urnen	660	cm2dvxbki0001145dj5azmbmp	2025-02-17 19:37:51.778	2025-02-17 19:37:51.778	t	Vanilla	\N
cm79gjmoz0005kqqkteskd06t	20	cm2dvxbki0002145d6ugzphtp	2025-02-17 19:37:51.779	2025-02-17 19:37:51.779	t	Black	\N
cm79gjmoz0007kqqk450wea8l	731	cm2dvxbki0003145d6ns02rq9	2025-02-17 19:37:51.78	2025-02-17 19:37:51.78	t	Applesauce 	\N
cm79gjmp00009kqqkce6fykha	3644	cm2dvxbki0004145drl0lylfj	2025-02-17 19:37:51.78	2025-02-17 19:37:51.78	t	Royal Navy 	\N
cm79gjmp0000bkqqkefqtt5al	1233	cm2dvxbki0005145d3phoi7xo	2025-02-17 19:37:51.781	2025-02-17 19:37:51.781	t	Pony 	\N
cm79gjmp1000dkqqksxn3rl00	2532	cm2dvxbki0006145dt0o9ajvw	2025-02-17 19:37:51.781	2025-02-17 19:37:51.781	t	Pretty in Pink 	\N
cm79gjmp1000fkqqkv2zlz4m0	1912	cm2dvxbki0007145dm0cq0uhw	2025-02-17 19:37:51.782	2025-02-17 19:37:51.782	t	Winterberry	\N
cm79gjmp2000hkqqkerze244k	3600	cm2dvxbki0009145db6zdbkac	2025-02-17 19:37:51.782	2025-02-17 19:37:51.782	t	Nordic Blue	\N
cm79gjmp2000jkqqkoboc5rro	1123	cm2qgaof600001g1dz74jp579	2025-02-17 19:37:51.782	2025-02-17 19:37:51.782	t	Carmel Cream	\N
cm79gjmp3000lkqqk87sxccii	1310	cm2qgaof600011g1dp0u6h8rj	2025-02-17 19:37:51.783	2025-02-17 19:37:51.783	t	Hunter Orange 	\N
cm79gjmp4000nkqqkcue9jpx3	605	cm2qgaof600021g1dm3492c46	2025-02-17 19:37:51.785	2025-02-17 19:37:51.785	t	Daisy	\N
cm79gjmp5000pkqqksr2b82sg	3761	cm2qgaof600031g1diekivra8	2025-02-17 19:37:51.785	2025-02-17 19:37:51.785	t	Winter Sky	\N
cm79gjmp6000rkqqkbpg4anhl	3951	cm2qgaof600031g1diekivra8	2025-02-17 19:37:51.786	2025-02-17 19:37:51.786	t	Azure Blue	\N
cm79gjmp6000tkqqk6dk9ztzx	6133	cm2qgaof600041g1d3ydxcw0k	2025-02-17 19:37:51.786	2025-02-17 19:37:51.786	t	Caper	\N
cm79gjmp6000vkqqkbdl2pg5f	5934	cm2qgaof600041g1d3ydxcw0k	2025-02-17 19:37:51.787	2025-02-17 19:37:51.787	t	Moss Green	\N
cm79gjmp7000xkqqkmek43eod	5565	cm2qgaof600051g1dpktyh5ln	2025-02-17 19:37:51.787	2025-02-17 19:37:51.787	t	Enchanting Forest 	\N
cm79gjmp7000zkqqkv5aw4fly	2101	cm2qgaof600061g1dlelq43ou	2025-02-17 19:37:51.788	2025-02-17 19:37:51.788	t	Country Red	\N
cm79gjmp70011kqqk64aszlkr	4620	cm2qgaof600071g1dor51myoe	2025-02-17 19:37:51.788	2025-02-17 19:37:51.788	t	Jade	\N
cm79gjmp80013kqqk3rrc24ak	2550	cm2qgaof700081g1dvacvsfuy	2025-02-17 19:37:51.788	2025-02-17 19:37:51.788	t	Soft Pink	\N
cm79gjmp80015kqqkypyihkx6	17	cm2qgaof700091g1dkc931kol	2025-02-17 19:37:51.789	2025-02-17 19:37:51.789	t	Paper White	\N
cm79gjmp90017kqqkexd9nnrr	3971	cm2qgaof7000a1g1dvndqvxgt	2025-02-17 19:37:51.789	2025-02-17 19:37:51.789	t	Silver	\N
cm79gjmp90019kqqkl1iw4vou	138	cm2qgaof7000b1g1d58lej3q9	2025-02-17 19:37:51.789	2025-02-17 19:37:51.789	t	Heavy Storm 	\N
cm79gjmp9001bkqqkju94gcth	111	cm2qgaof7000b1g1d58lej3q9	2025-02-17 19:37:51.79	2025-02-17 19:37:51.79	t	Whale	\N
cm79gjmpa001dkqqkzknfnyo7	1332	cm2qgaof7000c1g1dp877zci4	2025-02-17 19:37:51.79	2025-02-17 19:37:51.79	t	Harvest	\N
cm79gjmpb001fkqqk8pd47rej	2715	cm2qgaof7000d1g1d381xj9o3	2025-02-17 19:37:51.791	2025-02-17 19:37:51.791	t	Pansy	\N
cm79gjmpb001hkqqkik9idhbt	2905	cm2qgaof7000e1g1dlkcw80ui	2025-02-17 19:37:51.792	2025-02-17 19:37:51.792	t	Iris Blue	\N
cm79gjmpc001jkqqkw3zibzvd	1233	cm2dvxbki0008145dt5iddlgw	2025-02-17 19:37:51.792	2025-02-17 19:37:51.792	t	Pony 	\N
cm79gjmpc001lkqqkhz5qer92	10	\N	2025-02-17 19:37:51.793	2025-02-17 19:37:51.793	f	Silky White	\N
cm79gjmpd001nkqqk4k4ab07m	15	\N	2025-02-17 19:37:51.793	2025-02-17 19:37:51.793	f	White	\N
cm79gjmpd001pkqqkzdi74j2f	101	\N	2025-02-17 19:37:51.794	2025-02-17 19:37:51.794	f	Eggshell	\N
cm79gjmpd001rkqqkjhbhic77	105	\N	2025-02-17 19:37:51.794	2025-02-17 19:37:51.794	f	Ash Mist 	\N
cm79gjmpe001tkqqk2bmsk504	108	\N	2025-02-17 19:37:51.794	2025-02-17 19:37:51.794	f	Cobblestone	\N
cm79gjmpe001vkqqkfo1747qb	112	\N	2025-02-17 19:37:51.794	2025-02-17 19:37:51.794	f	Leadville	\N
cm79gjmpe001xkqqkiifabby3	124	\N	2025-02-17 19:37:51.795	2025-02-17 19:37:51.795	f	Fieldstone	\N
cm79gjmpe001zkqqkpuq6jtqc	131	\N	2025-02-17 19:37:51.795	2025-02-17 19:37:51.795	f	Smoke	\N
cm79gjmpf0021kqqkdys4k78c	132	\N	2025-02-17 19:37:51.795	2025-02-17 19:37:51.795	f	Dark Pewter	\N
cm79gjmpf0023kqqkf58ww3b5	142	\N	2025-02-17 19:37:51.795	2025-02-17 19:37:51.795	f	Sterling	\N
cm79gjmpf0025kqqkapjg4sy6	145	\N	2025-02-17 19:37:51.796	2025-02-17 19:37:51.796	f	Skylight	\N
cm79gjmpg0027kqqkrnrfd1rv	150	\N	2025-02-17 19:37:51.796	2025-02-17 19:37:51.796	f	Mystik Grey	\N
cm79gjmpg0029kqqkxopj2pk7	151	\N	2025-02-17 19:37:51.797	2025-02-17 19:37:51.797	f	Cloud	\N
cm79gjmpg002bkqqk2fajvf44	152	\N	2025-02-17 19:37:51.797	2025-02-17 19:37:51.797	f	Dolphin	\N
cm79gjmph002dkqqktw86h71f	170	\N	2025-02-17 19:37:51.797	2025-02-17 19:37:51.797	f	Sea Shell	\N
cm79gjmph002fkqqkjygy9jwy	176	\N	2025-02-17 19:37:51.797	2025-02-17 19:37:51.797	f	Fog	\N
cm79gjmph002hkqqkvcxo6zb0	180	\N	2025-02-17 19:37:51.798	2025-02-17 19:37:51.798	f	Whitewash	\N
cm79gjmph002jkqqkt0lasui8	182	\N	2025-02-17 19:37:51.798	2025-02-17 19:37:51.798	f	Saturn Grey	\N
cm79gjmpi002lkqqkpul9s6aq	184	\N	2025-02-17 19:37:51.798	2025-02-17 19:37:51.798	f	Pearl	\N
cm79gjmpi002nkqqkejoqpbgf	220	\N	2025-02-17 19:37:51.799	2025-02-17 19:37:51.799	f	Sunbeam 	\N
cm79gjmpi002pkqqk5y6tkeik	221	\N	2025-02-17 19:37:51.799	2025-02-17 19:37:51.799	f	Light Brass	\N
cm79gjmpj002rkqqkuaty6cza	230	\N	2025-02-17 19:37:51.799	2025-02-17 19:37:51.799	f	Easter Dress 	\N
cm79gjmpj002tkqqk7zv0znwb	232	\N	2025-02-17 19:37:51.799	2025-02-17 19:37:51.799	f	Seaweed	\N
cm79gjmpj002vkqqkm9eu828a	250	\N	2025-02-17 19:37:51.8	2025-02-17 19:37:51.8	f	Lemon Frost	\N
cm79gjmpk002xkqqk1ac0ezvq	270	\N	2025-02-17 19:37:51.8	2025-02-17 19:37:51.8	f	Buttercream	\N
cm79gjmpl002zkqqkmww5vfax	310	\N	2025-02-17 19:37:51.801	2025-02-17 19:37:51.801	f	Yellow	\N
cm79gjmpl0031kqqkvmrcysnu	311	\N	2025-02-17 19:37:51.802	2025-02-17 19:37:51.802	f	Canary	\N
cm79gjmpm0033kqqkeoiggehe	345	\N	2025-02-17 19:37:51.802	2025-02-17 19:37:51.802	f	Moss	\N
cm79gjmpm0035kqqkcmgbfcak	352	\N	2025-02-17 19:37:51.803	2025-02-17 19:37:51.803	f	Marsh	\N
cm79gjmpn0037kqqkpxp3kwuy	442	\N	2025-02-17 19:37:51.803	2025-02-17 19:37:51.803	f	Tarnished Gold	\N
cm79gjmpn0039kqqkz6x9iwly	453	\N	2025-02-17 19:37:51.803	2025-02-17 19:37:51.803	f	Army Drab	\N
cm79gjmpn003bkqqkz2xk5x07	463	\N	2025-02-17 19:37:51.804	2025-02-17 19:37:51.804	f	Cypress	\N
cm79gjmpn003dkqqkkq17ezg8	465	\N	2025-02-17 19:37:51.804	2025-02-17 19:37:51.804	f	Umber	\N
cm79gjmpo003fkqqk2ale07ql	501	\N	2025-02-17 19:37:51.804	2025-02-17 19:37:51.804	f	Sun 	\N
cm79gjmpo003hkqqkdnv5yavc	504	\N	2025-02-17 19:37:51.804	2025-02-17 19:37:51.804	f	Mimosa	\N
cm79gjmpo003jkqqkogyxm7c9	506	\N	2025-02-17 19:37:51.805	2025-02-17 19:37:51.805	f	Yellow Bird	\N
cm79gjmpo003lkqqkiietpmsl	520	\N	2025-02-17 19:37:51.805	2025-02-17 19:37:51.805	f	Daffodil	\N
cm79gjmpp003nkqqke5m9lihs	532	\N	2025-02-17 19:37:51.805	2025-02-17 19:37:51.805	f	Champagne	\N
cm79gjmpp003pkqqk5xf153yu	542	\N	2025-02-17 19:37:51.805	2025-02-17 19:37:51.805	f	Ochre	\N
cm79gjmpp003rkqqka0u9cc5j	546	\N	2025-02-17 19:37:51.806	2025-02-17 19:37:51.806	f	Ginger	\N
cm79gjmpp003tkqqk19gmadld	552	\N	2025-02-17 19:37:51.806	2025-02-17 19:37:51.806	f	Flax	\N
cm79gjmpq003vkqqkgdsx0eu0	600	\N	2025-02-17 19:37:51.806	2025-02-17 19:37:51.806	f	Citrus	\N
cm79gjmpq003xkqqk2fsj06eb	608	\N	2025-02-17 19:37:51.806	2025-02-17 19:37:51.806	f	Sunshine	\N
cm79gjmpq003zkqqk30wo2599	622	\N	2025-02-17 19:37:51.807	2025-02-17 19:37:51.807	f	Star Gold	\N
cm79gjmpq0041kqqkp7cwzv2s	630	\N	2025-02-17 19:37:51.807	2025-02-17 19:37:51.807	f	Buttercup	\N
cm79gjmpr0043kqqkzd9o9cz2	640	\N	2025-02-17 19:37:51.807	2025-02-17 19:37:51.807	f	Parchment	\N
cm79gjmpr0045kqqkze84h7gy	643	\N	2025-02-17 19:37:51.808	2025-02-17 19:37:51.808	f	Barewood 	\N
cm79gjmps0047kqqk689qkck7	651	\N	2025-02-17 19:37:51.809	2025-02-17 19:37:51.809	f	Cornsilk	\N
cm79gjmps0049kqqk3ubhy086	670	\N	2025-02-17 19:37:51.809	2025-02-17 19:37:51.809	f	Cream	\N
cm79gjmpt004bkqqkufb365s4	672	\N	2025-02-17 19:37:51.809	2025-02-17 19:37:51.809	f	Baguette	\N
cm79gjmpt004dkqqk5wh70ybd	700	\N	2025-02-17 19:37:51.809	2025-02-17 19:37:51.809	f	Bright Yellow	\N
cm79gjmpt004fkqqkwrpvrkk7	702	\N	2025-02-17 19:37:51.81	2025-02-17 19:37:51.81	f	Papaya	\N
cm79gjmpt004hkqqkd4d6g8py	703	\N	2025-02-17 19:37:51.81	2025-02-17 19:37:51.81	f	Orange Peel 	\N
cm79gjmpu004jkqqk2do2lyme	704	\N	2025-02-17 19:37:51.81	2025-02-17 19:37:51.81	f	Gold	\N
cm79gjmpu004lkqqkawsoxtwo	706	\N	2025-02-17 19:37:51.81	2025-02-17 19:37:51.81	f	Sunflower 	\N
cm79gjmpu004nkqqkjmcwm0rb	713	\N	2025-02-17 19:37:51.811	2025-02-17 19:37:51.811	f	Lemon	\N
cm79gjmpu004pkqqk3ruur3ju	721	\N	2025-02-17 19:37:51.811	2025-02-17 19:37:51.811	f	Antique 	\N
cm79gjmpv004rkqqk3jgr14x1	722	\N	2025-02-17 19:37:51.811	2025-02-17 19:37:51.811	f	Khaki	\N
cm79gjmpv004tkqqk5ivq48j2	747	\N	2025-02-17 19:37:51.811	2025-02-17 19:37:51.811	f	Golden Brown	\N
cm79gjmpv004vkqqknp8kfnr1	761	\N	2025-02-17 19:37:51.812	2025-02-17 19:37:51.812	f	Oat	\N
cm79gjmpv004xkqqkli00dyha	771	\N	2025-02-17 19:37:51.812	2025-02-17 19:37:51.812	f	Rattan	\N
cm79gjmpw004zkqqkm94wga21	776	\N	2025-02-17 19:37:51.812	2025-02-17 19:37:51.812	f	Sage	\N
cm79gjmpw0051kqqkrraqpu0f	781	\N	2025-02-17 19:37:51.812	2025-02-17 19:37:51.812	f	Candlewick 	\N
cm79gjmpw0053kqqketufny8a	800	\N	2025-02-17 19:37:51.813	2025-02-17 19:37:51.813	f	Goldenrod	\N
cm79gjmpx0055kqqkkcy2lq09	811	\N	2025-02-17 19:37:51.813	2025-02-17 19:37:51.813	f	Candlelight	\N
cm79gjmpx0057kqqkq6loav5j	821	\N	2025-02-17 19:37:51.813	2025-02-17 19:37:51.813	f	Honey Gold	\N
cm79gjmpx0059kqqkhwmi6kvw	822	\N	2025-02-17 19:37:51.814	2025-02-17 19:37:51.814	f	Palomino	\N
cm79gjmpx005bkqqkiatqh84y	824	\N	2025-02-17 19:37:51.814	2025-02-17 19:37:51.814	f	Liberty Gold	\N
cm79gjmpy005dkqqkm4yhlwv0	832	\N	2025-02-17 19:37:51.814	2025-02-17 19:37:51.814	f	Sisal	\N
cm79gjmpy005fkqqkrxtjbo3d	842	\N	2025-02-17 19:37:51.814	2025-02-17 19:37:51.814	f	Toffee	\N
cm79gjmpy005hkqqkaj52t0vk	851	\N	2025-02-17 19:37:51.815	2025-02-17 19:37:51.815	f	Old Gold	\N
cm79gjmpy005jkqqk83qwetya	853	\N	2025-02-17 19:37:51.815	2025-02-17 19:37:51.815	f	Pecan	\N
cm79gjmpz005lkqqkaav7zvin	861	\N	2025-02-17 19:37:51.815	2025-02-17 19:37:51.815	f	Tantone	\N
cm79gjmpz005nkqqk0em6q3il	862	\N	2025-02-17 19:37:51.816	2025-02-17 19:37:51.816	f	Wild Rice	\N
cm79gjmq0005pkqqk4t0lclqu	870	\N	2025-02-17 19:37:51.816	2025-02-17 19:37:51.816	f	Muslin	\N
cm79gjmq0005rkqqkworq9o6i	873	\N	2025-02-17 19:37:51.816	2025-02-17 19:37:51.816	f	Stone	\N
cm79gjmq0005tkqqkjsvdmqdo	874	\N	2025-02-17 19:37:51.816	2025-02-17 19:37:51.816	f	Gravel	\N
cm79gjmq0005vkqqk1cfeeyyp	904	\N	2025-02-17 19:37:51.817	2025-02-17 19:37:51.817	f	Spanish Gold	\N
cm79gjmq1005xkqqkxvhgylon	922	\N	2025-02-17 19:37:51.817	2025-02-17 19:37:51.817	f	Ashley Gold	\N
cm79gjmq1005zkqqkssc554be	931	\N	2025-02-17 19:37:51.818	2025-02-17 19:37:51.818	f	Honey	\N
cm79gjmq10061kqqkkep8x7g9	932	\N	2025-02-17 19:37:51.818	2025-02-17 19:37:51.818	f	Nutmeg	\N
cm79gjmq20063kqqkz2zwxyvn	933	\N	2025-02-17 19:37:51.818	2025-02-17 19:37:51.818	f	Redwood	\N
cm79gjmq20065kqqkcymw2j92	934	\N	2025-02-17 19:37:51.818	2025-02-17 19:37:51.818	f	Fawn	\N
cm79gjmq20067kqqkofrdxc5p	940	\N	2025-02-17 19:37:51.819	2025-02-17 19:37:51.819	f	Autumn Leaf	\N
cm79gjmq20069kqqk6ser6zcd	941	\N	2025-02-17 19:37:51.819	2025-02-17 19:37:51.819	f	Golden Grain	\N
cm79gjmq3006bkqqk3ryr1zzt	945	\N	2025-02-17 19:37:51.819	2025-02-17 19:37:51.819	f	Pine Park	\N
cm79gjmq3006dkqqkcdddrsbe	970	\N	2025-02-17 19:37:51.819	2025-02-17 19:37:51.819	f	Linen	\N
cm79gjmq3006fkqqk47rz2u5l	1010	\N	2025-02-17 19:37:51.82	2025-02-17 19:37:51.82	f	Toast	\N
cm79gjmq3006hkqqkdzx80ab5	1055	\N	2025-02-17 19:37:51.82	2025-02-17 19:37:51.82	f	Bark	\N
cm79gjmq4006jkqqk8e676rsj	1060	\N	2025-02-17 19:37:51.82	2025-02-17 19:37:51.82	f	Shrimp Pink	\N
cm79gjmq4006lkqqk8lk4y62c	1061	\N	2025-02-17 19:37:51.82	2025-02-17 19:37:51.82	f	Taupe	\N
cm79gjmq4006nkqqk774kplbf	1102	\N	2025-02-17 19:37:51.82	2025-02-17 19:37:51.82	f	Pumpkin	\N
cm79gjmq4006pkqqknsag485f	1106	\N	2025-02-17 19:37:51.821	2025-02-17 19:37:51.821	f	Orange 	\N
cm79gjmq5006rkqqk52xgdzlf	1114	\N	2025-02-17 19:37:51.821	2025-02-17 19:37:51.821	f	Clay	\N
cm79gjmq5006tkqqk02a445nc	1115	\N	2025-02-17 19:37:51.821	2025-02-17 19:37:51.821	f	Copper	\N
cm79gjmq5006vkqqkv328prds	1120	\N	2025-02-17 19:37:51.822	2025-02-17 19:37:51.822	f	Sunset 	\N
cm79gjmq5006xkqqkbz89yc1s	1134	\N	2025-02-17 19:37:51.822	2025-02-17 19:37:51.822	f	Light Cocoa	\N
cm79gjmq6006zkqqk7nk8gvv0	1140	\N	2025-02-17 19:37:51.822	2025-02-17 19:37:51.822	f	Meringue	\N
cm79gjmq60071kqqksrum6z5d	1141	\N	2025-02-17 19:37:51.822	2025-02-17 19:37:51.822	f	Tan	\N
cm79gjmq60073kqqk3cs2q7k5	1154	\N	2025-02-17 19:37:51.823	2025-02-17 19:37:51.823	f	Penny	\N
cm79gjmq70075kqqki2zd2wfs	1161	\N	2025-02-17 19:37:51.823	2025-02-17 19:37:51.823	f	Straw	\N
cm79gjmq70077kqqk3c5k6nh8	1172	\N	2025-02-17 19:37:51.823	2025-02-17 19:37:51.823	f	Ivory	\N
cm79gjmq70079kqqkfastp4am	1220	\N	2025-02-17 19:37:51.824	2025-02-17 19:37:51.824	f	Apricot	\N
cm79gjmq7007bkqqkhb0s9ikd	1252	\N	2025-02-17 19:37:51.824	2025-02-17 19:37:51.824	f	Dark Tan	\N
cm79gjmq8007dkqqk34ij43g3	1300	\N	2025-02-17 19:37:51.825	2025-02-17 19:37:51.825	f	Tangerine	\N
cm79gjmq9007fkqqk2ik6k185	1301	\N	2025-02-17 19:37:51.826	2025-02-17 19:37:51.826	f	Paprika	\N
cm79gjmqa007hkqqk50cnifpr	1304	\N	2025-02-17 19:37:51.826	2025-02-17 19:37:51.826	f	Red Pepper	\N
cm79gjmqa007jkqqkuoiijo0t	1305	\N	2025-02-17 19:37:51.826	2025-02-17 19:37:51.826	f	Fox Fire	\N
cm79gjmqa007lkqqk2w36ohu8	1306	\N	2025-02-17 19:37:51.827	2025-02-17 19:37:51.827	f	Devil Red 	\N
cm79gjmqb007nkqqk4kete0y1	1311	\N	2025-02-17 19:37:51.827	2025-02-17 19:37:51.827	f	Date	\N
cm79gjmqb007pkqqk74u45z8e	1312	\N	2025-02-17 19:37:51.827	2025-02-17 19:37:51.827	f	Burnt Orange	\N
cm79gjmqb007rkqqkpn6oopq1	1322	\N	2025-02-17 19:37:51.828	2025-02-17 19:37:51.828	f	Dirty Penny 	\N
cm79gjmqb007tkqqkfzlv7vzb	1334	\N	2025-02-17 19:37:51.828	2025-02-17 19:37:51.828	f	Spice	\N
cm79gjmqc007vkqqkaogw8to2	1335	\N	2025-02-17 19:37:51.828	2025-02-17 19:37:51.828	f	Dark Rust	\N
cm79gjmqc007xkqqk5dld3102	1342	\N	2025-02-17 19:37:51.828	2025-02-17 19:37:51.828	f	Rust	\N
cm79gjmqc007zkqqk1pzrmo2t	1344	\N	2025-02-17 19:37:51.829	2025-02-17 19:37:51.829	f	Coffee Bean	\N
cm79gjmqc0081kqqkmhmt829v	1351	\N	2025-02-17 19:37:51.829	2025-02-17 19:37:51.829	f	Starfish	\N
cm79gjmqd0083kqqkyiyheuyf	1352	\N	2025-02-17 19:37:51.829	2025-02-17 19:37:51.829	f	Salmon	\N
cm79gjmqd0085kqqkw6wlg1pf	1355	\N	2025-02-17 19:37:51.829	2025-02-17 19:37:51.829	f	Fox	\N
cm79gjmqd0087kqqkhdgtythu	1362	\N	2025-02-17 19:37:51.83	2025-02-17 19:37:51.83	f	Shrimp	\N
cm79gjmqd0089kqqkta4r5rfl	1366	\N	2025-02-17 19:37:51.83	2025-02-17 19:37:51.83	f	Mahogany	\N
cm79gjmqe008bkqqk15jlnnm3	1375	\N	2025-02-17 19:37:51.83	2025-02-17 19:37:51.83	f	Dark Charcoal	\N
cm79gjmqe008dkqqkzhzw1va7	1430	\N	2025-02-17 19:37:51.83	2025-02-17 19:37:51.83	f	Melon	\N
cm79gjmqe008fkqqkxrx048fm	1501	\N	2025-02-17 19:37:51.831	2025-02-17 19:37:51.831	f	Watermelon 	\N
cm79gjmqe008hkqqknt8rczc7	1514	\N	2025-02-17 19:37:51.831	2025-02-17 19:37:51.831	f	Brick	\N
cm79gjmqf008jkqqkmuzql78b	1521	\N	2025-02-17 19:37:51.831	2025-02-17 19:37:51.831	f	Flamingo	\N
cm79gjmqf008lkqqk5jobwxpg	1526	\N	2025-02-17 19:37:51.831	2025-02-17 19:37:51.831	f	Apple Butter 	\N
cm79gjmqf008nkqqkwyxbrig2	1532	\N	2025-02-17 19:37:51.832	2025-02-17 19:37:51.832	f	Coral	\N
cm79gjmqf008pkqqktykj1sh9	1543	\N	2025-02-17 19:37:51.832	2025-02-17 19:37:51.832	f	Rusty Rose 	\N
cm79gjmqg008rkqqkdnm52vip	1551	\N	2025-02-17 19:37:51.832	2025-02-17 19:37:51.832	f	Pink Clay	\N
cm79gjmqh008tkqqkux3tst79	1565	\N	2025-02-17 19:37:51.833	2025-02-17 19:37:51.833	f	Espresso	\N
cm79gjmqh008vkqqkm4b4moll	1600	\N	2025-02-17 19:37:51.833	2025-02-17 19:37:51.833	f	Spanish Tile	\N
cm79gjmqh008xkqqk9aqu9yvj	1701	\N	2025-02-17 19:37:51.834	2025-02-17 19:37:51.834	f	Red Berry	\N
cm79gjmqh008zkqqk7aue0b1n	1703	\N	2025-02-17 19:37:51.834	2025-02-17 19:37:51.834	f	Poppy	\N
cm79gjmqi0091kqqkrppug4ox	1704	\N	2025-02-17 19:37:51.834	2025-02-17 19:37:51.834	f	Candy Apple	\N
cm79gjmqi0093kqqkl2o99rci	1720	\N	2025-02-17 19:37:51.834	2025-02-17 19:37:51.834	f	Not Quite Red 	\N
cm79gjmqi0095kqqkalleilsh	1725	\N	2025-02-17 19:37:51.835	2025-02-17 19:37:51.835	f	Terra Cotta	\N
cm79gjmqi0097kqqk2zd1kf8p	1730	\N	2025-02-17 19:37:51.835	2025-02-17 19:37:51.835	f	Persimmon	\N
cm79gjmqj0099kqqktqauhqy7	1753	\N	2025-02-17 19:37:51.835	2025-02-17 19:37:51.835	f	Strawberries & Cream 	\N
cm79gjmqj009bkqqk7oryspe8	1755	\N	2025-02-17 19:37:51.836	2025-02-17 19:37:51.836	f	Hyacinth	\N
cm79gjmqj009dkqqkgv8vhxve	1760	\N	2025-02-17 19:37:51.836	2025-02-17 19:37:51.836	f	Twine	\N
cm79gjmqk009fkqqk1f2x0aqj	1761	\N	2025-02-17 19:37:51.836	2025-02-17 19:37:51.836	f	Tea Rose	\N
cm79gjmqk009hkqqkrvj4ntl3	1776	\N	2025-02-17 19:37:51.836	2025-02-17 19:37:51.836	f	Blackberry 	\N
cm79gjmqk009jkqqkmhk5jdyu	1800	\N	2025-02-17 19:37:51.837	2025-02-17 19:37:51.837	f	Wildfire	\N
cm79gjmqk009lkqqkp18kxntf	1805	\N	2025-02-17 19:37:51.837	2025-02-17 19:37:51.837	f	Strawberry	\N
cm79gjmql009nkqqktudi8fr2	1840	\N	2025-02-17 19:37:51.837	2025-02-17 19:37:51.837	f	Corsage	\N
cm79gjmql009pkqqkundmwmf9	1860	\N	2025-02-17 19:37:51.837	2025-02-17 19:37:51.837	f	Shell	\N
cm79gjmql009rkqqk8v9pyj9r	1874	\N	2025-02-17 19:37:51.837	2025-02-17 19:37:51.837	f	Pewter	\N
cm79gjmql009tkqqk0idcdre3	1876	\N	2025-02-17 19:37:51.838	2025-02-17 19:37:51.838	f	Chocolate	\N
cm79gjmql009vkqqk9yeg6pqn	1900	\N	2025-02-17 19:37:51.838	2025-02-17 19:37:51.838	f	Geranium	\N
cm79gjmqm009xkqqkc2uhstfx	1902	\N	2025-02-17 19:37:51.838	2025-02-17 19:37:51.838	f	Poinsettia	\N
cm79gjmqm009zkqqkeuavvljq	1903	\N	2025-02-17 19:37:51.839	2025-02-17 19:37:51.839	f	Lipstick	\N
cm79gjmqm00a1kqqk0ckq1pki	1904	\N	2025-02-17 19:37:51.839	2025-02-17 19:37:51.839	f	Cardinal	\N
cm79gjmqn00a3kqqks4hbzsbx	1906	\N	2025-02-17 19:37:51.839	2025-02-17 19:37:51.839	f	Tulip	\N
cm79gjmqn00a5kqqkp4ozdm0e	1911	\N	2025-02-17 19:37:51.839	2025-02-17 19:37:51.839	f	Foliage Rose	\N
cm79gjmqn00a7kqqkzxlxnn4x	1913	\N	2025-02-17 19:37:51.84	2025-02-17 19:37:51.84	f	Cherry	\N
cm79gjmqo00a9kqqkj3b2kmbi	1921	\N	2025-02-17 19:37:51.84	2025-02-17 19:37:51.84	f	Blossom	\N
cm79gjmqo00abkqqkhv4kcmy2	1940	\N	2025-02-17 19:37:51.84	2025-02-17 19:37:51.84	f	Chrysanthemum 	\N
cm79gjmqo00adkqqkfeg14dnl	1950	\N	2025-02-17 19:37:51.84	2025-02-17 19:37:51.84	f	Tropical Pink 	\N
cm79gjmqo00afkqqk4i1sit3i	1972	\N	2025-02-17 19:37:51.841	2025-02-17 19:37:51.841	f	Silvery Grey	\N
cm79gjmqo00ahkqqky5qu34c7	2011	\N	2025-02-17 19:37:51.841	2025-02-17 19:37:51.841	f	Fire Engine	\N
cm79gjmqp00ajkqqkp4bzf5l0	2022	\N	2025-02-17 19:37:51.841	2025-02-17 19:37:51.841	f	Rio Red	\N
cm79gjmqp00alkqqkmuyto72z	2051	\N	2025-02-17 19:37:51.842	2025-02-17 19:37:51.842	f	Teaberry	\N
cm79gjmqp00ankqqk8g32tohg	2113	\N	2025-02-17 19:37:51.842	2025-02-17 19:37:51.842	f	Cranberry	\N
cm79gjmqp00apkqqk4ncryf42	2115	\N	2025-02-17 19:37:51.842	2025-02-17 19:37:51.842	f	Beet Red	\N
cm79gjmqq00arkqqkhftnbs2z	2123	\N	2025-02-17 19:37:51.842	2025-02-17 19:37:51.842	f	Bordeaux	\N
cm79gjmqq00atkqqk9izxri9c	2152	\N	2025-02-17 19:37:51.842	2025-02-17 19:37:51.842	f	Heather Pink	\N
cm79gjmqq00avkqqkqc9ms4oh	2153	\N	2025-02-17 19:37:51.843	2025-02-17 19:37:51.843	f	Dusty Mauve	\N
cm79gjmqr00axkqqkhzehryhb	2155	\N	2025-02-17 19:37:51.843	2025-02-17 19:37:51.843	f	Pink Tulip	\N
cm79gjmqr00azkqqkv8w5ywjq	2160	\N	2025-02-17 19:37:51.843	2025-02-17 19:37:51.843	f	Iced Pink	\N
cm79gjmqr00b1kqqkmgnqja4b	2166	\N	2025-02-17 19:37:51.843	2025-02-17 19:37:51.843	f	Flesh	\N
cm79gjmqr00b3kqqkf8vj4caj	2170	\N	2025-02-17 19:37:51.844	2025-02-17 19:37:51.844	f	Chiffon	\N
cm79gjmqs00b5kqqkrz7tmfkc	2171	\N	2025-02-17 19:37:51.844	2025-02-17 19:37:51.844	f	Blush	\N
cm79gjmqs00b7kqqkhe87g7wn	2220	\N	2025-02-17 19:37:51.844	2025-02-17 19:37:51.844	f	Tropicana	\N
cm79gjmqs00b9kqqk1axz221z	2222	\N	2025-02-17 19:37:51.845	2025-02-17 19:37:51.845	f	Burgundy	\N
cm79gjmqs00bbkqqkeb3pdbsy	2224	\N	2025-02-17 19:37:51.845	2025-02-17 19:37:51.845	f	Claret	\N
cm79gjmqt00bdkqqkg3i986vb	2241	\N	2025-02-17 19:37:51.845	2025-02-17 19:37:51.845	f	Mauve	\N
cm79gjmqt00bfkqqk45qqfr9n	2250	\N	2025-02-17 19:37:51.845	2025-02-17 19:37:51.845	f	Petal Pink	\N
cm79gjmqt00bhkqqkx7czzp3u	2300	\N	2025-02-17 19:37:51.846	2025-02-17 19:37:51.846	f	Bright Ruby	\N
cm79gjmqt00bjkqqkyxcuc1ti	2320	\N	2025-02-17 19:37:51.846	2025-02-17 19:37:51.846	f	Raspberry	\N
cm79gjmqu00blkqqk15f75tja	2333	\N	2025-02-17 19:37:51.846	2025-02-17 19:37:51.846	f	Wine	\N
cm79gjmqu00bnkqqkva4bs9ct	2336	\N	2025-02-17 19:37:51.846	2025-02-17 19:37:51.846	f	Maroon	\N
cm79gjmqu00bpkqqk32kqgwq5	2363	\N	2025-02-17 19:37:51.847	2025-02-17 19:37:51.847	f	Carnation	\N
cm79gjmqu00brkqqkpb8ak1kj	2500	\N	2025-02-17 19:37:51.847	2025-02-17 19:37:51.847	f	Boysenberry	\N
cm79gjmqv00btkqqkbb6lda1r	2504	\N	2025-02-17 19:37:51.847	2025-02-17 19:37:51.847	f	Plum	\N
cm79gjmqv00bvkqqkgwbpdjoz	2506	\N	2025-02-17 19:37:51.847	2025-02-17 19:37:51.847	f	Cerise	\N
cm79gjmqv00bxkqqkw85iyse6	2508	\N	2025-02-17 19:37:51.848	2025-02-17 19:37:51.848	f	Hot Pink 	\N
cm79gjmqv00bzkqqk0ysfx0d1	2510	\N	2025-02-17 19:37:51.848	2025-02-17 19:37:51.848	f	Roseate	\N
cm79gjmqw00c1kqqkkkpm8ldo	2520	\N	2025-02-17 19:37:51.848	2025-02-17 19:37:51.848	f	Garden Rose	\N
cm79gjmqw00c3kqqkorg1qzsi	2521	\N	2025-02-17 19:37:51.848	2025-02-17 19:37:51.848	f	Fuchsia	\N
cm79gjmqw00c5kqqk2ow0tlvp	2530	\N	2025-02-17 19:37:51.849	2025-02-17 19:37:51.849	f	Rose	\N
cm79gjmqw00c7kqqkvz0ss1jg	2560	\N	2025-02-17 19:37:51.849	2025-02-17 19:37:51.849	f	Azalea Pink	\N
cm79gjmqx00c9kqqkwmdowkix	2576	\N	2025-02-17 19:37:51.849	2025-02-17 19:37:51.849	f	Greyhound	\N
cm79gjmqx00cbkqqk6232lhcu	2600	\N	2025-02-17 19:37:51.849	2025-02-17 19:37:51.849	f	Dusty Grape	\N
cm79gjmqx00cdkqqkiv5x5ilp	2640	\N	2025-02-17 19:37:51.85	2025-02-17 19:37:51.85	f	Frosted Plum	\N
cm79gjmqx00cfkqqk67215usr	2650	\N	2025-02-17 19:37:51.85	2025-02-17 19:37:51.85	f	Impatience	\N
cm79gjmqy00chkqqk3h6jdiup	2655	\N	2025-02-17 19:37:51.85	2025-02-17 19:37:51.85	f	Aura	\N
cm79gjmqy00cjkqqk7f0r9wib	2674	\N	2025-02-17 19:37:51.85	2025-02-17 19:37:51.85	f	Steel Blue	\N
cm79gjmqy00clkqqkisr0zqcl	2711	\N	2025-02-17 19:37:51.851	2025-02-17 19:37:51.851	f	Dark Current	\N
cm79gjmqy00cnkqqkafkqvj66	2720	\N	2025-02-17 19:37:51.851	2025-02-17 19:37:51.851	f	Sangria	\N
cm79gjmqz00cpkqqkz3lcylkl	2721	\N	2025-02-17 19:37:51.851	2025-02-17 19:37:51.851	f	Very Berry	\N
cm79gjmqz00crkqqkcuyhuqig	2761	\N	2025-02-17 19:37:51.851	2025-02-17 19:37:51.851	f	Dessert	\N
cm79gjmqz00ctkqqkdvpaepyx	2764	\N	2025-02-17 19:37:51.852	2025-02-17 19:37:51.852	f	Violet	\N
cm79gjmr000cvkqqks9dqu2zd	2810	\N	2025-02-17 19:37:51.852	2025-02-17 19:37:51.852	f	Orchid	\N
cm79gjmr000cxkqqkhhvyl30r	2830	\N	2025-02-17 19:37:51.852	2025-02-17 19:37:51.852	f	Wild Iris	\N
cm79gjmr000czkqqknnr916qv	2832	\N	2025-02-17 19:37:51.853	2025-02-17 19:37:51.853	f	Easter Purple	\N
cm79gjmr000d1kqqk4x84el1j	2900	\N	2025-02-17 19:37:51.853	2025-02-17 19:37:51.853	f	Deep Purple	\N
cm79gjmr100d3kqqkqgtdr50b	2910	\N	2025-02-17 19:37:51.853	2025-02-17 19:37:51.853	f	Grape	\N
cm79gjmr100d5kqqk8l9xh8bt	2912	\N	2025-02-17 19:37:51.853	2025-02-17 19:37:51.853	f	Sugar Plum	\N
cm79gjmr100d7kqqk060j1m5g	2920	\N	2025-02-17 19:37:51.853	2025-02-17 19:37:51.853	f	Purple	\N
cm79gjmr100d9kqqkm1ahh39y	2944	\N	2025-02-17 19:37:51.854	2025-02-17 19:37:51.854	f	Scrumptious Plum 	\N
cm79gjmr100dbkqqkyep0hz81	3040	\N	2025-02-17 19:37:51.854	2025-02-17 19:37:51.854	f	Lavender	\N
cm79gjmr200ddkqqk92mpum3m	3045	\N	2025-02-17 19:37:51.854	2025-02-17 19:37:51.854	f	Cachet	\N
cm79gjmr200dfkqqkbudh85cu	3062	\N	2025-02-17 19:37:51.854	2025-02-17 19:37:51.854	f	Cinder	\N
cm79gjmr200dhkqqk7497gqdt	3102	\N	2025-02-17 19:37:51.855	2025-02-17 19:37:51.855	f	Provence	\N
cm79gjmr200djkqqky2vgowic	3110	\N	2025-02-17 19:37:51.855	2025-02-17 19:37:51.855	f	Dark Ink	\N
cm79gjmr300dlkqqkuvtgjs0o	3114	\N	2025-02-17 19:37:51.855	2025-02-17 19:37:51.855	f	Purple Twist	\N
cm79gjmr300dnkqqktt4mjtgi	3130	\N	2025-02-17 19:37:51.855	2025-02-17 19:37:51.855	f	Dawn of Violet 	\N
cm79gjmr300dpkqqkp1obl0q1	3150	\N	2025-02-17 19:37:51.856	2025-02-17 19:37:51.856	f	Stainless	\N
cm79gjmr300drkqqknd07grf0	3151	\N	2025-02-17 19:37:51.856	2025-02-17 19:37:51.856	f	Blue Dawn	\N
cm79gjmr400dtkqqkqngqq2fv	3210	\N	2025-02-17 19:37:51.856	2025-02-17 19:37:51.856	f	Blueberry	\N
cm79gjmr400dvkqqko8krxktz	3211	\N	2025-02-17 19:37:51.856	2025-02-17 19:37:51.856	f	Twilight	\N
cm79gjmr400dxkqqkze38b2eh	3241	\N	2025-02-17 19:37:51.857	2025-02-17 19:37:51.857	f	Amethyst Frost	\N
cm79gjmr400dzkqqkvou0lshj	3251	\N	2025-02-17 19:37:51.857	2025-02-17 19:37:51.857	f	Haze	\N
cm79gjmr500e1kqqkxizs8mza	3323	\N	2025-02-17 19:37:51.857	2025-02-17 19:37:51.857	f	Delft	\N
cm79gjmr500e3kqqktprr0p7f	3331	\N	2025-02-17 19:37:51.857	2025-02-17 19:37:51.857	f	Cadet Blue	\N
cm79gjmr500e5kqqk1vqul869	3332	\N	2025-02-17 19:37:51.858	2025-02-17 19:37:51.858	f	Forget Me Not 	\N
cm79gjmr500e7kqqkwmo0b9gb	3333	\N	2025-02-17 19:37:51.858	2025-02-17 19:37:51.858	f	Fire Blue	\N
cm79gjmr600e9kqqkd68541cz	3335	\N	2025-02-17 19:37:51.858	2025-02-17 19:37:51.858	f	Flag Blue	\N
cm79gjmr600ebkqqkkhnmyo9z	3344	\N	2025-02-17 19:37:51.858	2025-02-17 19:37:51.858	f	Midnight	\N
cm79gjmr600edkqqkefje17vr	3350	\N	2025-02-17 19:37:51.858	2025-02-17 19:37:51.858	f	Lavender Whisper 	\N
cm79gjmr600efkqqkmt6jqfc5	3353	\N	2025-02-17 19:37:51.859	2025-02-17 19:37:51.859	f	Light Midnight	\N
cm79gjmr600ehkqqkjppvgq4m	3355	\N	2025-02-17 19:37:51.859	2025-02-17 19:37:51.859	f	Dark Indigo	\N
cm79gjmr700ejkqqkjdl2tzvw	3444	\N	2025-02-17 19:37:51.859	2025-02-17 19:37:51.859	f	Concord	\N
cm79gjmr700elkqqkvyxp61rn	3522	\N	2025-02-17 19:37:51.859	2025-02-17 19:37:51.859	f	Blue	\N
cm79gjmr700enkqqkul3drqbb	3536	\N	2025-02-17 19:37:51.86	2025-02-17 19:37:51.86	f	Heraldic	\N
cm79gjmr700epkqqka2zh0yos	3541	\N	2025-02-17 19:37:51.86	2025-02-17 19:37:51.86	f	Venetian Blue	\N
cm79gjmr800erkqqkiide9zg1	3543	\N	2025-02-17 19:37:51.86	2025-02-17 19:37:51.86	f	Royal Blue	\N
cm79gjmr800etkqqk5822k7jq	3544	\N	2025-02-17 19:37:51.86	2025-02-17 19:37:51.86	f	Sapphire	\N
cm79gjmr800evkqqkg44k3nn9	3554	\N	2025-02-17 19:37:51.861	2025-02-17 19:37:51.861	f	Navy	\N
cm79gjmr800exkqqkjl2m91a8	3572	\N	2025-02-17 19:37:51.861	2025-02-17 19:37:51.861	f	Summer Grey 	\N
cm79gjmr900ezkqqkn0eo02kh	3574	\N	2025-02-17 19:37:51.861	2025-02-17 19:37:51.861	f	Darkest Blue 	\N
cm79gjmr900f1kqqknrk51i0m	3611	\N	2025-02-17 19:37:51.861	2025-02-17 19:37:51.861	f	Blue Ribbon	\N
cm79gjmr900f3kqqk252pg387	3612	\N	2025-02-17 19:37:51.861	2025-02-17 19:37:51.861	f	Starlight Blue	\N
cm79gjmr900f5kqqk5gimh5ok	3620	\N	2025-02-17 19:37:51.862	2025-02-17 19:37:51.862	f	Marine Blue	\N
cm79gjmr900f7kqqkbe8o50ya	3622	\N	2025-02-17 19:37:51.862	2025-02-17 19:37:51.862	f	Imperial Blue	\N
cm79gjmra00f9kqqk1sfmb4b9	3630	\N	2025-02-17 19:37:51.862	2025-02-17 19:37:51.862	f	Sweet Boy 	\N
cm79gjmra00fbkqqk191b9mml	3640	\N	2025-02-17 19:37:51.862	2025-02-17 19:37:51.862	f	Lake Blue	\N
cm79gjmra00fdkqqkxuwpimps	3641	\N	2025-02-17 19:37:51.863	2025-02-17 19:37:51.863	f	Wedgewood Blue	\N
cm79gjmra00ffkqqkdzyoyuc0	3650	\N	2025-02-17 19:37:51.863	2025-02-17 19:37:51.863	f	Ice Cap	\N
cm79gjmrb00fhkqqk8j27xcuh	3652	\N	2025-02-17 19:37:51.863	2025-02-17 19:37:51.863	f	Baby Blue	\N
cm79gjmrb00fjkqqk0ctyy037	3654	\N	2025-02-17 19:37:51.863	2025-02-17 19:37:51.863	f	Blue Shadow 	\N
cm79gjmrb00flkqqkipcb8050	3710	\N	2025-02-17 19:37:51.864	2025-02-17 19:37:51.864	f	Blue Bird	\N
cm79gjmrb00fnkqqkz4x15lcd	3711	\N	2025-02-17 19:37:51.864	2025-02-17 19:37:51.864	f	Dolphin Blue	\N
cm79gjmrb00fpkqqk25wru6pq	3722	\N	2025-02-17 19:37:51.864	2025-02-17 19:37:51.864	f	Empire Blue	\N
cm79gjmrc00frkqqkbfd6gule	3730	\N	2025-02-17 19:37:51.864	2025-02-17 19:37:51.864	f	Something Blue 	\N
cm79gjmrc00ftkqqk489upie4	3732	\N	2025-02-17 19:37:51.865	2025-02-17 19:37:51.865	f	Slate Blue	\N
cm79gjmrc00fvkqqk9d5ekkvh	3743	\N	2025-02-17 19:37:51.865	2025-02-17 19:37:51.865	f	Harbor	\N
cm79gjmrd00fxkqqkpryn5221	3750	\N	2025-02-17 19:37:51.865	2025-02-17 19:37:51.865	f	Winter Frost	\N
cm79gjmrd00fzkqqkjfh2y09e	3762	\N	2025-02-17 19:37:51.865	2025-02-17 19:37:51.865	f	Country Blue	\N
cm79gjmrd00g1kqqkv7dnw2h0	3770	\N	2025-02-17 19:37:51.866	2025-02-17 19:37:51.866	f	Oyster	\N
cm79gjmrd00g3kqqkqipo5lo0	3810	\N	2025-02-17 19:37:51.866	2025-02-17 19:37:51.866	f	Laguna	\N
cm79gjmre00g5kqqkxwo436qi	3815	\N	2025-02-17 19:37:51.866	2025-02-17 19:37:51.866	f	Reef Blue	\N
cm79gjmre00g7kqqk4h9e0pp4	3820	\N	2025-02-17 19:37:51.866	2025-02-17 19:37:51.866	f	Celestial	\N
cm79gjmre00g9kqqk1lx9ohh6	3830	\N	2025-02-17 19:37:51.866	2025-02-17 19:37:51.866	f	Surfs Up 	\N
cm79gjmre00gbkqqkigyqfokl	3840	\N	2025-02-17 19:37:51.867	2025-02-17 19:37:51.867	f	Oxford	\N
cm79gjmre00gdkqqkzww5b1kl	3842	\N	2025-02-17 19:37:51.867	2025-02-17 19:37:51.867	f	Copenhagen	\N
cm79gjmrf00gfkqqkfw8fu6nn	3853	\N	2025-02-17 19:37:51.867	2025-02-17 19:37:51.867	f	Ash Blue	\N
cm79gjmrf00ghkqqk4xsjtn02	3900	\N	2025-02-17 19:37:51.867	2025-02-17 19:37:51.867	f	Cerulean	\N
cm79gjmrf00gjkqqkc87wzw4e	3901	\N	2025-02-17 19:37:51.868	2025-02-17 19:37:51.868	f	Tropical Blue	\N
cm79gjmrf00glkqqkl7829ciw	3902	\N	2025-02-17 19:37:51.868	2025-02-17 19:37:51.868	f	Colonial Blue	\N
cm79gjmrg00gnkqqko5k471hd	3906	\N	2025-02-17 19:37:51.868	2025-02-17 19:37:51.868	f	Pacific Blue	\N
cm79gjmrg00gpkqqkpbn6reh8	3910	\N	2025-02-17 19:37:51.868	2025-02-17 19:37:51.868	f	Crystal Blue	\N
cm79gjmrg00grkqqk0xp36dk0	3920	\N	2025-02-17 19:37:51.869	2025-02-17 19:37:51.869	f	Chicory	\N
cm79gjmrh00gtkqqkzszt6xud	3953	\N	2025-02-17 19:37:51.869	2025-02-17 19:37:51.869	f	Ocean Blue	\N
cm79gjmrh00gvkqqknf3oe96y	3962	\N	2025-02-17 19:37:51.869	2025-02-17 19:37:51.869	f	River Mist	\N
cm79gjmrh00gxkqqkye15u1z1	3963	\N	2025-02-17 19:37:51.869	2025-02-17 19:37:51.869	f	Hint of Blue 	\N
cm79gjmrh00gzkqqkdwozb9kl	4010	\N	2025-02-17 19:37:51.87	2025-02-17 19:37:51.87	f	Caribbean blue	\N
cm79gjmrh00h1kqqk6mdz7ghb	4032	\N	2025-02-17 19:37:51.87	2025-02-17 19:37:51.87	f	Teal	\N
cm79gjmri00h3kqqkmc15xuwq	4033	\N	2025-02-17 19:37:51.87	2025-02-17 19:37:51.87	f	Tartan Blue	\N
cm79gjmri00h5kqqkpfkd0dp5	4071	\N	2025-02-17 19:37:51.87	2025-02-17 19:37:51.87	f	Glacier Green	\N
cm79gjmri00h7kqqk24ohguch	4073	\N	2025-02-17 19:37:51.871	2025-02-17 19:37:51.871	f	Metal	\N
cm79gjmri00h9kqqkk8765w5z	4101	\N	2025-02-17 19:37:51.871	2025-02-17 19:37:51.871	f	Wave Blue	\N
cm79gjmrj00hbkqqk4kw39n7l	4103	\N	2025-02-17 19:37:51.871	2025-02-17 19:37:51.871	f	California Blue	\N
cm79gjmrj00hdkqqks603k5bo	4111	\N	2025-02-17 19:37:51.871	2025-02-17 19:37:51.871	f	Turquoise	\N
cm79gjmrj00hfkqqk1tfr4idf	4113	\N	2025-02-17 19:37:51.871	2025-02-17 19:37:51.871	f	Alexis Blue	\N
cm79gjmrj00hhkqqk6si224es	4114	\N	2025-02-17 19:37:51.872	2025-02-17 19:37:51.872	f	Danish Teal	\N
cm79gjmrk00hjkqqkxfkeqtbd	4116	\N	2025-02-17 19:37:51.872	2025-02-17 19:37:51.872	f	Dark Teal	\N
cm79gjmrk00hlkqqkeui96vyu	4122	\N	2025-02-17 19:37:51.872	2025-02-17 19:37:51.872	f	Peacock	\N
cm79gjmrk00hnkqqkxqulmlnw	4133	\N	2025-02-17 19:37:51.872	2025-02-17 19:37:51.872	f	Deep Ocean	\N
cm79gjmrk00hpkqqkev9rndhz	4152	\N	2025-02-17 19:37:51.873	2025-02-17 19:37:51.873	f	Serenity 	\N
cm79gjmrk00hrkqqk53anbpsa	4174	\N	2025-02-17 19:37:51.873	2025-02-17 19:37:51.873	f	Charcoal	\N
cm79gjmrl00htkqqk3bnlhi5f	4220	\N	2025-02-17 19:37:51.873	2025-02-17 19:37:51.873	f	Island Green	\N
cm79gjmrl00hvkqqkzy2apklx	4230	\N	2025-02-17 19:37:51.873	2025-02-17 19:37:51.873	f	Aqua	\N
cm79gjmrl00hxkqqkc39ndiq7	4240	\N	2025-02-17 19:37:51.874	2025-02-17 19:37:51.874	f	Spearmint	\N
cm79gjmrl00hzkqqk19e99leq	4250	\N	2025-02-17 19:37:51.874	2025-02-17 19:37:51.874	f	Snowmoon	\N
cm79gjmrm00i1kqqkshs8nx7e	4332	\N	2025-02-17 19:37:51.874	2025-02-17 19:37:51.874	f	Rough Sea	\N
cm79gjmrm00i3kqqk1jxc93f8	4410	\N	2025-02-17 19:37:51.875	2025-02-17 19:37:51.875	f	Aqua Velva	\N
cm79gjmrm00i5kqqkxt9ab3an	4421	\N	2025-02-17 19:37:51.875	2025-02-17 19:37:51.875	f	Light Mallard	\N
cm79gjmrn00i7kqqknes2bl9h	4423	\N	2025-02-17 19:37:51.875	2025-02-17 19:37:51.875	f	Marine Aqua	\N
cm79gjmrn00i9kqqkwxojl7yu	4425	\N	2025-02-17 19:37:51.875	2025-02-17 19:37:51.875	f	Dark Aqua	\N
cm79gjmrn00ibkqqk9fydz8dg	4430	\N	2025-02-17 19:37:51.876	2025-02-17 19:37:51.876	f	Island Waters	\N
cm79gjmrn00idkqqk9vgf5e2w	4442	\N	2025-02-17 19:37:51.876	2025-02-17 19:37:51.876	f	Deep Sea Blue	\N
cm79gjmro00ifkqqkr13m329k	4452	\N	2025-02-17 19:37:51.876	2025-02-17 19:37:51.876	f	Truly Teal	\N
cm79gjmro00ihkqqkn2768igl	4515	\N	2025-02-17 19:37:51.876	2025-02-17 19:37:51.876	f	Spruce	\N
cm79gjmro00ijkqqkz0v6tku5	4531	\N	2025-02-17 19:37:51.877	2025-02-17 19:37:51.877	f	Caribbean	\N
cm79gjmro00ilkqqkf49qmoox	4610	\N	2025-02-17 19:37:51.877	2025-02-17 19:37:51.877	f	Deep Aqua	\N
cm79gjmrp00inkqqks4i47czl	4625	\N	2025-02-17 19:37:51.877	2025-02-17 19:37:51.877	f	Seagreen	\N
cm79gjmrp00ipkqqkt42smrhk	4643	\N	2025-02-17 19:37:51.877	2025-02-17 19:37:51.877	f	Amazon	\N
cm79gjmrp00irkqqkswfj97ht	4644	\N	2025-02-17 19:37:51.878	2025-02-17 19:37:51.878	f	Mallard	\N
cm79gjmrp00itkqqkw4aevdm1	4752	\N	2025-02-17 19:37:51.878	2025-02-17 19:37:51.878	f	Vintage Blue 	\N
cm79gjmrq00ivkqqkk7ho0h05	4952	\N	2025-02-17 19:37:51.878	2025-02-17 19:37:51.878	f	Mystic Ocean 	\N
cm79gjmrq00ixkqqkb5y9i50i	5005	\N	2025-02-17 19:37:51.878	2025-02-17 19:37:51.878	f	Rain Forest	\N
cm79gjmrq00izkqqk5nlmghcd	5010	\N	2025-02-17 19:37:51.878	2025-02-17 19:37:51.878	f	Scotty Green	\N
cm79gjmrq00j1kqqka3sdjcba	5050	\N	2025-02-17 19:37:51.879	2025-02-17 19:37:51.879	f	Luster	\N
cm79gjmrq00j3kqqkrh9b0mxd	5100	\N	2025-02-17 19:37:51.879	2025-02-17 19:37:51.879	f	Green	\N
cm79gjmrr00j5kqqkrhyebts7	5101	\N	2025-02-17 19:37:51.879	2025-02-17 19:37:51.879	f	Dark Jade	\N
cm79gjmrr00j7kqqk0rsl32ae	5115	\N	2025-02-17 19:37:51.879	2025-02-17 19:37:51.879	f	Baccarat Green	\N
cm79gjmrr00j9kqqkkz83bs45	5210	\N	2025-02-17 19:37:51.88	2025-02-17 19:37:51.88	f	Trellis Green	\N
cm79gjmrr00jbkqqkpo5lpy8a	5220	\N	2025-02-17 19:37:51.88	2025-02-17 19:37:51.88	f	Silver Sage	\N
cm79gjmrs00jdkqqk4lxpq0i7	5230	\N	2025-02-17 19:37:51.88	2025-02-17 19:37:51.88	f	Bottle Green	\N
cm79gjmrs00jfkqqkr646sk7f	5233	\N	2025-02-17 19:37:51.88	2025-02-17 19:37:51.88	f	Field Green	\N
cm79gjmrs00jhkqqkdi7jbaub	5324	\N	2025-02-17 19:37:51.88	2025-02-17 19:37:51.88	f	Bright Green	\N
cm79gjmrs00jjkqqkh745im4q	5326	\N	2025-02-17 19:37:51.881	2025-02-17 19:37:51.881	f	Evergreen	\N
cm79gjmrs00jlkqqk2kciamvo	5335	\N	2025-02-17 19:37:51.881	2025-02-17 19:37:51.881	f	Swamp	\N
cm79gjmrt00jnkqqkpxuevj7u	5374	\N	2025-02-17 19:37:51.881	2025-02-17 19:37:51.881	f	Forest Green	\N
cm79gjmrt00jpkqqki184i5e5	5400	\N	2025-02-17 19:37:51.881	2025-02-17 19:37:51.881	f	Scrub Green	\N
cm79gjmrt00jrkqqk1lwtemzn	5411	\N	2025-02-17 19:37:51.882	2025-02-17 19:37:51.882	f	Shamrock	\N
cm79gjmrt00jtkqqktopoi0n2	5415	\N	2025-02-17 19:37:51.882	2025-02-17 19:37:51.882	f	Irish Green	\N
cm79gjmru00jvkqqkjb792vc1	5422	\N	2025-02-17 19:37:51.882	2025-02-17 19:37:51.882	f	Swiss Ivy	\N
cm79gjmru00jxkqqk3aw1s1c7	5440	\N	2025-02-17 19:37:51.882	2025-02-17 19:37:51.882	f	Mint 	\N
cm79gjmru00jzkqqk5b8o67mb	5450	\N	2025-02-17 19:37:51.883	2025-02-17 19:37:51.883	f	Basic Seafoam 	\N
cm79gjmru00k1kqqkgqslrcj9	5500	\N	2025-02-17 19:37:51.883	2025-02-17 19:37:51.883	f	Limedrop 	\N
cm79gjmru00k3kqqkfkbxb0xa	5510	\N	2025-02-17 19:37:51.883	2025-02-17 19:37:51.883	f	Emerald	\N
cm79gjmrv00k5kqqkhsud9ebm	5513	\N	2025-02-17 19:37:51.883	2025-02-17 19:37:51.883	f	Ming	\N
cm79gjmrv00k7kqqko0cpa4ck	5515	\N	2025-02-17 19:37:51.883	2025-02-17 19:37:51.883	f	Kelly	\N
cm79gjmrv00k9kqqko1u1gkwa	5531	\N	2025-02-17 19:37:51.884	2025-02-17 19:37:51.884	f	Pear	\N
cm79gjmrv00kbkqqkb6zhleql	5552	\N	2025-02-17 19:37:51.884	2025-02-17 19:37:51.884	f	Palm Leaf	\N
cm79gjmrv00kdkqqkqpr4lpev	5555	\N	2025-02-17 19:37:51.884	2025-02-17 19:37:51.884	f	Deep Green	\N
cm79gjmrw00kfkqqkmtr9dk8a	5610	\N	2025-02-17 19:37:51.884	2025-02-17 19:37:51.884	f	Bright Mint	\N
cm79gjmrw00khkqqkqfc8oza3	5613	\N	2025-02-17 19:37:51.884	2025-02-17 19:37:51.884	f	Light Kelly	\N
cm79gjmrw00kjkqqk1mo3eupx	5633	\N	2025-02-17 19:37:51.885	2025-02-17 19:37:51.885	f	Lime	\N
cm79gjmrw00klkqqk0ttlewl7	5643	\N	2025-02-17 19:37:51.885	2025-02-17 19:37:51.885	f	Green Dust	\N
cm79gjmrx00knkqqkm37ihoqo	5650	\N	2025-02-17 19:37:51.885	2025-02-17 19:37:51.885	f	Spring Frost	\N
cm79gjmrx00kpkqqkmx24ducw	5664	\N	2025-02-17 19:37:51.885	2025-02-17 19:37:51.885	f	Willow	\N
cm79gjmrx00krkqqkigamlhfl	5722	\N	2025-02-17 19:37:51.885	2025-02-17 19:37:51.885	f	Green Grass	\N
cm79gjmrx00ktkqqk7ua001ik	5730	\N	2025-02-17 19:37:51.886	2025-02-17 19:37:51.886	f	Apple Green	\N
cm79gjmrx00kvkqqkummuigcb	5740	\N	2025-02-17 19:37:51.886	2025-02-17 19:37:51.886	f	Mint	\N
cm79gjmrx00kxkqqkre5nuocp	5770	\N	2025-02-17 19:37:51.886	2025-02-17 19:37:51.886	f	Spanish Moss	\N
cm79gjmry00kzkqqkz71vpp93	5822	\N	2025-02-17 19:37:51.886	2025-02-17 19:37:51.886	f	Kiwi	\N
cm79gjmry00l1kqqk9p9ox4pi	5833	\N	2025-02-17 19:37:51.886	2025-02-17 19:37:51.886	f	Lima Bean	\N
cm79gjmry00l3kqqk1ln6k2n4	5866	\N	2025-02-17 19:37:51.887	2025-02-17 19:37:51.887	f	Herb Green	\N
cm79gjmry00l5kqqkwpoymsku	5912	\N	2025-02-17 19:37:51.887	2025-02-17 19:37:51.887	f	Erin Green	\N
cm79gjmry00l7kqqkktjx3tei	5933	\N	2025-02-17 19:37:51.887	2025-02-17 19:37:51.887	f	Grasshopper	\N
cm79gjmrz00l9kqqkz6wk6xpx	5940	\N	2025-02-17 19:37:51.887	2025-02-17 19:37:51.887	f	Sour Apple 	\N
cm79gjmrz00lbkqqkse4e0zh6	5944	\N	2025-02-17 19:37:51.887	2025-02-17 19:37:51.887	f	Backyard Green	\N
cm79gjmrz00ldkqqk4cguxrzx	6010	\N	2025-02-17 19:37:51.888	2025-02-17 19:37:51.888	f	Mountain Dew 	\N
cm79gjmrz00lfkqqk24ba6u40	6011	\N	2025-02-17 19:37:51.888	2025-02-17 19:37:51.888	f	Tamarack	\N
cm79gjms000lhkqqki6d6odsb	6031	\N	2025-02-17 19:37:51.888	2025-02-17 19:37:51.888	f	Limelight 	\N
cm79gjms000ljkqqkemvj3lf8	6051	\N	2025-02-17 19:37:51.888	2025-02-17 19:37:51.888	f	Jalapeno	\N
cm79gjms000llkqqkkhpyhirv	6141	\N	2025-02-17 19:37:51.888	2025-02-17 19:37:51.888	f	Spring Green	\N
cm79gjms000lnkqqk0o8obbo2	6151	\N	2025-02-17 19:37:51.889	2025-02-17 19:37:51.889	f	Lemongrass 	\N
cm79gjms000lpkqqkkgqw68k7	6156	\N	2025-02-17 19:37:51.889	2025-02-17 19:37:51.889	f	Olive	\N
\.


--
-- Data for Name: LeatherColor; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."LeatherColor" (id, name, abbreviation, "createdAt", "updatedAt", "isLimitedEditionLeather", url_id) FROM stdin;
cm2cns61i000313hyqmcgyq0e	Candy Blue	CB	2024-10-17 02:05:14.262	2024-10-17 02:01:47.703	f	\N
cm2cns61i000413hy33aa3pud	Dark Chocolate	DC	2024-10-17 02:05:14.262	2024-10-17 02:01:48.123	f	\N
cm2cns61i000613hyeqj54zrz	Hot Pink	HP	2024-10-17 02:05:14.262	2024-10-17 02:01:48.702	f	\N
cm2cns61i000713hyrwhg9dif	Light Royal	LR	2024-10-17 02:05:14.262	2024-10-17 02:01:48.903	f	\N
cm2cns61i000913hyhjn0hu9g	Pebbled Black	PB	2024-10-17 02:05:14.262	2024-10-17 02:01:49.253	f	\N
cm2cns61i000a13hy1flrgnqb	Powder Blue	PoBu	2024-10-17 02:05:14.262	2024-10-17 02:01:49.456	f	\N
cm2cns61i000b13hy49artt54	Pebbled Crimson	PC	2024-10-17 02:05:14.262	2024-10-17 02:01:49.623	f	\N
cm2cns61i000c13hy246fbglj	Pebbled Charcoal	PeCh	2024-10-17 02:05:14.262	2024-10-17 02:01:49.823	f	\N
cm2cns61i000d13hyl60ce9kw	Pebbled Marshmallow	PM	2024-10-17 02:05:14.262	2024-10-17 02:01:49.99	f	\N
cm2cns61i000e13hy950a9gtu	Pebbled Royal	PR	2024-10-17 02:05:14.262	2024-10-17 02:01:50.157	f	\N
cm2cns61i000g13hy1kz542ba	Pebbled Teal	PT	2024-10-17 02:05:14.262	2024-10-17 02:04:00.547	f	\N
cm2cns61i000h13hyt01sr3py	Pebbled White	PW	2024-10-17 02:05:14.262	2024-10-17 02:04:00.983	f	\N
cm2cns61i000i13hyqtgjyuaz	Rustic Walnut	RW	2024-10-17 02:05:14.262	2024-10-17 02:04:01.416	f	\N
cm2cns61j000j13hy64e5qirc	Smooth Grey	SG	2024-10-17 02:05:14.262	2024-10-17 02:04:01.9	f	\N
cm2cns61j000k13hyw9zokpoo	Smooth Marshmallow	SM	2024-10-17 02:05:14.262	2024-10-17 02:04:02.515	f	\N
cm2cns61j000l13hy976waddm	Shiny Navy	SN	2024-10-17 02:05:14.262	2024-10-17 02:04:03.132	f	\N
cm2cns61j000m13hyebmzwi47	Smooth White	SW	2024-10-17 02:05:14.262	2024-10-17 02:04:04.219	f	\N
cm2cns61i000013hyeks31jrt	Butterscotch	B	2024-10-17 02:05:14.262	2024-10-18 00:22:19.073	f	\N
cm2cns61i000213hyi8jex0hf	British Racing Green	BRG	2024-10-17 02:05:14.262	2024-10-18 00:22:19.073	f	\N
cm2cns61i000813hyspmia8eq	Rustic Olive	O	2024-10-17 02:05:14.262	2024-10-26 18:02:27.649	f	\N
cm2qgxtxc000j1g1dovq0j7ei	Rustic Ostrich	RO	2024-10-26 18:02:27.649	2024-10-26 18:02:57.96	f	\N
cm2qgxtxc000i1g1dbi0p3ux9	Shiny Black Ostrich	BSO	2024-10-26 18:02:27.649	2024-10-26 18:02:57.96	f	\N
cm2qgxtxd000k1g1dhkhrkj2g	Silver Croc	SC	2024-10-26 18:02:27.649	2024-10-26 18:02:57.96	f	\N
cm2qgxtxd000l1g1dy5o1gbu5	White Ostrich	WO	2024-10-26 18:02:27.649	2024-10-26 18:02:57.96	f	\N
cm2qgxtxc000h1g1d0oojrfn1	Antique Ostrich	AO	2024-10-26 18:02:27.649	2024-10-26 18:03:25.063	f	\N
cm2cns61i000113hyzw654kd9	Baby Blue	BB	2024-10-17 02:05:14.262	2025-01-10 02:26:59.221	f	\N
\.


--
-- Data for Name: PriceTier; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."PriceTier" (id, name, "shopifyPrice", "marketplacePrice", "createdAt", "updatedAt") FROM stdin;
cm67awvny0000uvdhhiq0nba0	Classic Base	140.00	155.00	2025-01-22 02:44:57.549	2025-01-22 02:40:00.422
cm67awvnz0001uvdheu42bhhf	Argyle Base	150.00	165.00	2025-01-22 02:44:57.549	2025-01-22 02:40:00.834
cm67awvnz0002uvdh5f69sh69	QClassic Base	170.00	185.00	2025-01-22 02:44:57.549	2025-01-22 02:40:01.242
cm67awvnz0003uvdhxl1a9mg2	Animal Base	145.00	160.00	2025-01-22 02:44:57.549	2025-01-22 02:40:01.675
cm67awvo00004uvdhrzb7iyct	Quilted Base	160.00	175.00	2025-01-22 02:44:57.549	2025-01-22 02:40:02.133
\.


--
-- Data for Name: ProductDataLPC; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."ProductDataLPC" (id, "shopifyProductId", "shopifyVariantId", "shopifyInventoryId", "SKU", "collectionId", "fontId", "shapeId", weight, "leatherColor1Id", "leatherColor2Id", "styleId", "mainHandle", "createdAt", "updatedAt", "offeringType", "baseSKU", "colorDesignationId", "embroideryThreadId", "isacordId") FROM stdin;
\.


--
-- Data for Name: ProductStitching; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."ProductStitching" (id, "productDataLPCId", "stitchingThreadId", "amannId") FROM stdin;
\.


--
-- Data for Name: Session; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Session" (id, shop, state, "isOnline", scope, expires, "accessToken", "userId", "firstName", "lastName", email, "accountOwner", locale, collaborator, "emailVerified") FROM stdin;
offline_test-lpc-product.myshopify.com	test-lpc-product.myshopify.com		f	read_orders,write_fulfillments,write_inventory,write_products	\N	shpua_bfd181b669511bde4bc4d136eb0a157a	\N	\N	\N	\N	f	\N	f	f
offline_lpc-product-management-dev1.myshopify.com	lpc-product-management-dev1.myshopify.com		f	\N	\N	shpua_ea5a8f54dbc808a62a4f183cc2a953c0	\N	\N	\N	\N	f	\N	f	f
offline_lpc-product-management-dev.myshopify.com	lpc-product-management-dev.myshopify.com		f	\N	\N	shpua_51b6debd3e4095ca8255588108cddabd	\N	\N	\N	\N	f	\N	f	f
\.


--
-- Data for Name: Shape; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Shape" (id, name, "createdAt", "updatedAt", abbreviation, "displayOrder", "shapeType") FROM stdin;
cm2duhfg300016y58sr14qoxd	3-Wood	2024-10-17 22:00:36.721	2025-01-03 01:12:10.064	3Wood	20	WOOD
cm2duhfg300026y58r1rnkvbc	5-Wood	2024-10-17 22:00:36.721	2025-01-03 01:12:10.064	5Wood	30	WOOD
cm2duhfg300036y583y11e4k3	7-Wood	2024-10-17 22:00:36.721	2025-01-03 01:12:10.064	7Wood	40	WOOD
cm2duhfg300046y58o8dsmwzo	Fairway	2024-10-17 22:00:36.721	2025-01-03 01:12:10.064	Fairway	50	WOOD
cm2duhfg300066y583ii779yr	Mallet	2024-10-17 22:00:36.721	2025-01-03 01:12:10.064	Mallet	70	PUTTER
cm2duhfg300076y585owscoo4	Blade	2024-10-17 22:00:36.721	2025-01-03 01:12:10.064	Blade	80	PUTTER
cm2duhfg000006y58dqulghkm	Driver	2024-10-17 22:00:36.721	2025-01-22 21:37:30.458	Driver	10	DRIVER
cm2duhfg300056y58ddfbtcxj	Hybrid	2024-10-17 22:00:36.721	2025-01-22 21:37:30.458	Hybrid	60	HYBRID
\.


--
-- Data for Name: ShapeTypeAdjustment; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."ShapeTypeAdjustment" (id, "tierId", "shapeType", "shopifyAdjustment", "marketAdjustment", "isBasePrice", "createdAt", "updatedAt") FROM stdin;
cm67b2wal0005uvdh1tpvrq0n	cm67awvny0000uvdhhiq0nba0	DRIVER	0.00	0.00	f	2025-01-22 02:49:38.301	2025-01-22 02:45:09.85
cm67b2wal0006uvdhi19ge7u9	cm67awvny0000uvdhhiq0nba0	WOOD	-10.00	-10.00	f	2025-01-22 02:49:38.301	2025-01-22 02:45:10.23
cm67b2wal0007uvdhpuctvmkd	cm67awvny0000uvdhhiq0nba0	HYBRID	-15.00	-15.00	f	2025-01-22 02:49:38.301	2025-01-22 02:45:10.621
cm68eisn70009uvdhocgbf190	cm67awvnz0003uvdhxl1a9mg2	DRIVER	0.00	0.00	f	2025-01-22 21:13:45.09	2025-01-22 21:11:58.585
cm68eisn9000auvdh53d2k3ms	cm67awvnz0003uvdhxl1a9mg2	WOOD	-10.00	-10.00	f	2025-01-22 21:13:45.09	2025-01-22 21:11:59.05
cm68eisn9000buvdhxwdxrrsd	cm67awvnz0003uvdhxl1a9mg2	HYBRID	-15.00	-15.00	f	2025-01-22 21:13:45.09	2025-01-22 21:11:59.517
cm68ekm2o000duvdh1gqx6blx	cm67awvnz0001uvdheu42bhhf	DRIVER	0.00	0.00	f	2025-01-22 21:15:09.889	2025-01-22 21:13:48.177
cm68ekm2p000euvdhmyiizv4x	cm67awvnz0001uvdheu42bhhf	WOOD	-10.00	-10.00	f	2025-01-22 21:15:09.889	2025-01-22 21:13:49.121
cm68ekm2p000fuvdh71klkcar	cm67awvnz0001uvdheu42bhhf	HYBRID	-15.00	-15.00	f	2025-01-22 21:15:09.889	2025-01-22 21:13:49.703
cm68ekm2p000guvdhppzkmk4h	cm67awvnz0001uvdheu42bhhf	PUTTER	150.00	165.00	t	2025-01-22 21:15:09.889	2025-01-22 21:13:50.17
cm67b2wam0008uvdhwjni0oc5	cm67awvny0000uvdhhiq0nba0	PUTTER	150.00	165.00	t	2025-01-22 02:49:38.301	2025-01-22 21:15:09.889
cm68eisn9000cuvdhj0t53do0	cm67awvnz0003uvdhxl1a9mg2	PUTTER	150.00	165.00	t	2025-01-22 21:13:45.09	2025-01-22 21:15:09.889
cm68em3ia000huvdhwiq05ir7	cm67awvo00004uvdhrzb7iyct	DRIVER	0.00	0.00	f	2025-01-22 21:16:19.138	2025-01-22 21:15:12.3
cm68em3ia000iuvdht72sc79e	cm67awvo00004uvdhrzb7iyct	WOOD	-10.00	-10.00	f	2025-01-22 21:16:19.138	2025-01-22 21:15:12.682
cm68em3ia000juvdhcnaw57vh	cm67awvo00004uvdhrzb7iyct	HYBRID	-15.00	-15.00	f	2025-01-22 21:16:19.138	2025-01-22 21:15:13.103
cm68em3ia000kuvdh2ya4hqlr	cm67awvo00004uvdhrzb7iyct	PUTTER	150.00	165.00	t	2025-01-22 21:16:19.138	2025-01-22 21:15:13.532
cm68enouc000luvdhqspyzipe	cm67awvnz0002uvdh5f69sh69	DRIVER	0.00	0.00	f	2025-01-22 21:17:33.445	2025-01-22 21:16:25.344
cm68enoud000muvdhcv7xw8v1	cm67awvnz0002uvdh5f69sh69	DRIVER	-10.00	-10.00	f	2025-01-22 21:17:33.445	2025-01-22 21:16:26.923
cm68enoud000nuvdhp1n3wno0	cm67awvnz0002uvdh5f69sh69	DRIVER	-15.00	-15.00	f	2025-01-22 21:17:33.445	2025-01-22 21:16:27.331
cm68enoud000ouvdhijgjkes0	cm67awvnz0002uvdh5f69sh69	DRIVER	150.00	165.00	t	2025-01-22 21:17:33.445	2025-01-22 21:16:27.697
\.


--
-- Data for Name: ShopifyCollections; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."ShopifyCollections" (id, "shopifyId", title, handle, "createdAt", "updatedAt", admin_graphql_api_id, "showInDropdown", "needsSecondaryLeather", "needsStitchingColor", "needsStyle", "commonDescription", description, "threadType", "needsColorDesignation", "skuPattern", "defaultStyleNamePattern", "stylePerCollection", "priceTierId") FROM stdin;
cm2nk5qi9000513g4daix79qn	430259470615	Animal Print	animal-print	2024-10-24 17:09:16.784	2025-01-25 02:23:46.095	gid://shopify/Collection/430259470615	t	t	f	t	t	Our Animal Print collection elevates our classic designs with beautiful embossed cowhides. These distinctive headcovers range from subtle, sophisticated patterns to bold, eye-catching designs – perfect for golfers who want to make a statement.	NONE	f	Animal-{leatherColors.primary.abbreviation}-{leatherColors.secondary.abbreviation}	STANDARD	f	cm67awvnz0003uvdhxl1a9mg2
cm2nk5qi9000213g42b33wihd	430415872279	Argyle	argyle	2024-10-24 17:09:16.784	2025-01-25 02:23:46.095	gid://shopify/Collection/430415872279	t	t	t	f	t	Our Argyle collection honors golf's Scottish heritage with a contemporary twist. Each diamond and contrasting cross-stitch is expertly hand-sewn by master craftsmen. From understated leather tones to bold animal prints, these headcovers let you showcase your personal style while maintaining classic sophistication.	STITCHING	f	Argyle-{leatherColors.primary.abbreviation}-{leatherColors.secondary.abbreviation}-{stitchingThreads.[0].abbreviation}	STANDARD	f	cm67awvnz0001uvdheu42bhhf
cm2nk5qi9000413g415csqbkq	470240231703	Quilted Classic	classic-quilted	2024-10-24 17:09:16.784	2025-01-25 02:23:46.095	gid://shopify/Collection/470240231703	t	t	f	t	t	Our Quilted Classic collection represents the pinnacle of our craft, combining the sophistication of our Quilted designs with the timeless appeal of our Classic styles. Each headcover is masterfully crafted by artisan leather craftsmen, featuring hand-stitched French seams and our signature diamond pattern.	NONE	t	QClassic-{leatherColors.primary.abbreviation}-{leatherColors.secondary.abbreviation}	STANDARD	f	cm67awvnz0002uvdh5f69sh69
cm2nkaznh000613g4b2ocmg9n	430259437847	Quilted	quilted	2024-10-24 17:13:21.917	2025-01-25 02:23:46.095	gid://shopify/Collection/430259437847	t	f	t	f	t	Our Quilted collection embodies timeless luxury, celebrating the days when craftsmanship and style were paramount. Each diamond pattern is meticulously hand-sewn with premium thread, creating a distinctive look that sets these headcovers apart.	EMBROIDERY	f	Quilted-{leatherColors.primary.abbreviation}-{globalEmbroideryThread.abbreviation}	STANDARD	f	cm67awvo00004uvdhrzb7iyct
cm2nk5qi9000313g4112ddfgp	465904730391	One-Off Creations	one-off-creations	2024-10-24 17:09:16.784	2025-01-03 18:25:43.673	gid://shopify/Collection/465904730391	f	f	f	f	t	\N	NONE	f	\N	STANDARD	f	\N
cm2nk5qi8000113g4uutiklwy	430414692631	Classic	classic	2024-10-24 17:09:16.784	2025-01-25 02:25:33.431	gid://shopify/Collection/430414692631	t	t	f	t	t	Our Classic collection celebrates traditional golf style with a luxurious twist. Each headcover features impeccable hand-stitched French seams, bold racing stripes, or timeless diagonal striping – perfect for golfers who appreciate refined, vintage-inspired design.	NONE	f	Classic-{leatherColors.primary.abbreviation}-{leatherColors.secondary.abbreviation}	STANDARD	f	cm67awvny0000uvdhhiq0nba0
\.


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
-- Data for Name: Style; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Style" (id, name, abbreviation, "createdAt", "updatedAt", "leatherPhrase", "useOppositeLeather", "customNamePattern", "namePattern", url_id) FROM stdin;
cm2duk0zp00096y58txlhef0r	2 Stripe	2	2024-10-23 22:11:25.716	2024-10-23 22:09:06.53	\N	f	\N	STANDARD	\N
cm2duk0zp000a6y58as5sriok	3 Stripe	3	2024-10-23 22:11:25.716	2024-10-23 22:09:07.063	\N	f	\N	STANDARD	\N
cm2duk0zp000b6y58ni0lmpzy	Racing Stripe	Racing	2024-10-23 22:11:25.716	2024-10-23 22:09:07.677	\N	f	\N	STANDARD	\N
cm5bmqkh8000jop7vtgqwv0nb	Interior Diamond	Diamond	2024-12-30 22:47:20.876	2024-12-31 18:16:14.388	\N	f	\N	STANDARD	\N
cm2duk0zp000d6y58z7vvtz3o	Fat Stripe	Fat	2024-10-23 22:11:25.716	2025-01-12 02:52:15.309	leather as	t	\N	STANDARD	\N
cm2mfig7o0000j10yb8ocpijj	Quilted Bottom	QBottom	2024-10-23 22:11:25.716	2025-01-12 02:52:15.309	leather as	f	\N	STANDARD	\N
cm2duk0zp000e6y58p91axp5o	Fat Middle	Middle	2024-10-23 22:11:25.716	2025-01-12 02:52:15.309	leather as	f	\N	STANDARD	\N
cm2duk0zo00086y581yq5luh2	Teardrop	Tear	2024-10-17 22:02:37.956	2025-01-12 02:52:15.309	leather as	f	\N	STANDARD	\N
cm2duk0zp000c6y58p4822b5n	50/50	50	2024-10-23 22:11:25.716	2025-01-14 04:02:18.724	leather on left	f	\N	STYLE_FIRST	\N
\.


--
-- Data for Name: StyleCollection; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."StyleCollection" (id, "styleId", "collectionId", "createdAt", "updatedAt", "overrideSecondaryLeather", "overrideStitchingColor", "handleTemplate", "seoTemplate", "titleTemplate", validation, "overrideColorDesignation", "skuPattern", "overrideCustomNamePattern", "overrideNamePattern") FROM stdin;
cm5bghktb0000op7vvnnscsqz	cm2mfig7o0000j10yb8ocpijj	cm2nk5qi9000413g415csqbkq	2024-12-30 19:52:23.711	2024-12-30 19:24:15.418	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
cm5bghktc0001op7v61izan4o	cm2duk0zp000e6y58p91axp5o	cm2nk5qi9000413g415csqbkq	2024-12-30 19:52:23.711	2024-12-30 19:24:15.778	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
cm5bghktd0002op7vyrb58pwd	cm2duk0zp000d6y58z7vvtz3o	cm2nk5qi9000413g415csqbkq	2024-12-30 19:52:23.711	2024-12-30 19:24:16.144	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
cm5bghktd0003op7v315bx2rr	cm2duk0zp000c6y58p4822b5n	cm2nk5qi9000413g415csqbkq	2024-12-30 19:52:23.711	2024-12-30 19:24:16.63	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
cm5bghktd0004op7vot8m1mfg	cm2duk0zo00086y581yq5luh2	cm2nk5qi9000413g415csqbkq	2024-12-30 19:52:23.711	2024-12-30 19:24:17.094	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
cm5bghktd0006op7vm0ocyydh	cm2duk0zp00096y58txlhef0r	cm2nk5qi8000113g4uutiklwy	2024-12-30 19:52:23.711	2025-01-16 03:19:55.163	\N	\N	\N	\N	\N	\N	t	\N	\N	\N
cm5bmbq5g000dop7vxw87beqc	cm2duk0zp00096y58txlhef0r	cm2nk5qi9000513g4daix79qn	2024-12-30 22:35:48.386	2025-01-16 03:19:55.163	\N	\N	\N	\N	\N	\N	t	\N	\N	\N
cm5bmbq5g000eop7vxqucd0o8	cm2duk0zp000a6y58as5sriok	cm2nk5qi9000513g4daix79qn	2024-12-30 22:35:48.386	2025-01-16 03:22:51.709	\N	\N	\N	\N	\N	\N	t	\N	\N	\N
cm5bghktd0007op7v3xmvlc15	cm2duk0zp000a6y58as5sriok	cm2nk5qi8000113g4uutiklwy	2024-12-30 19:52:23.711	2025-01-16 03:22:51.709	\N	\N	\N	\N	\N	\N	t	\N	\N	\N
cm5bghktd0009op7vy551qitf	cm2duk0zp000c6y58p4822b5n	cm2nk5qi8000113g4uutiklwy	2024-12-30 19:52:23.711	2025-01-16 03:24:15.266	\N	\N	\N	\N	\N	\N	t	\N	\N	\N
cm5bmbq5h000gop7v4ghedlxz	cm2duk0zp000c6y58p4822b5n	cm2nk5qi9000513g4daix79qn	2024-12-30 22:35:48.386	2025-01-16 03:24:15.266	\N	\N	\N	\N	\N	\N	t	\N	\N	\N
cm5bghktd0005op7vgdrbqsmu	cm2duk0zo00086y581yq5luh2	cm2nk5qi8000113g4uutiklwy	2024-12-30 19:52:23.711	2025-01-16 03:29:36.876	\N	\N	\N	\N	\N	\N	t	\N	\N	\N
cm5bghktd0008op7v1p9jju3r	cm2duk0zp000b6y58ni0lmpzy	cm2nk5qi8000113g4uutiklwy	2024-12-30 19:52:23.711	2025-01-16 03:29:36.876	\N	\N	\N	\N	\N	\N	t	\N	\N	\N
cm5bghkte000aop7v83lno8zb	cm2duk0zp000d6y58z7vvtz3o	cm2nk5qi8000113g4uutiklwy	2024-12-30 19:52:23.711	2025-01-16 03:29:36.876	\N	\N	\N	\N	\N	\N	t	\N	\N	\N
cm5bghkte000bop7vphbjym4c	cm2duk0zp000e6y58p91axp5o	cm2nk5qi8000113g4uutiklwy	2024-12-30 19:52:23.711	2025-01-16 03:29:36.876	\N	\N	\N	\N	\N	\N	t	\N	\N	\N
cm5bmbq5f000cop7vebnzm1bq	cm2duk0zo00086y581yq5luh2	cm2nk5qi9000513g4daix79qn	2024-12-30 22:35:48.386	2025-01-16 03:29:36.876	\N	\N	\N	\N	\N	\N	t	\N	\N	\N
cm5bmbq5h000fop7va2nictb1	cm2duk0zp000b6y58ni0lmpzy	cm2nk5qi9000513g4daix79qn	2024-12-30 22:35:48.386	2025-01-16 03:29:36.876	\N	\N	\N	\N	\N	\N	t	\N	\N	\N
cm5bmbq5h000hop7vdbkl4g6p	cm2duk0zp000d6y58z7vvtz3o	cm2nk5qi9000513g4daix79qn	2024-12-30 22:35:48.386	2025-01-16 03:29:36.876	\N	\N	\N	\N	\N	\N	t	\N	\N	\N
cm5bmbq5h000iop7vg7ubxr4o	cm2duk0zp000e6y58p91axp5o	cm2nk5qi9000513g4daix79qn	2024-12-30 22:35:48.386	2025-01-16 03:29:36.876	\N	\N	\N	\N	\N	\N	t	\N	\N	\N
cm5bmqyob000kop7vr7sydgz4	cm5bmqkh8000jop7vtgqwv0nb	cm2nk5qi9000413g415csqbkq	2024-12-30 22:47:39.276	2025-01-21 21:25:34.321	\N	t	{tempMainHandle}-golf-headcovers	{title} Golf Headcovers	{leatherColors.primary.label} Leather Quilted with {globalEmbroideryThread.label} Stitching and {leatherColors.secondary.label} Interior Diamond	{"required": ["leatherColors.primary", "leatherColors.secondary", "globalEmbroideryThread"], "errorMessages": {"leatherColors.primary": "Primary leather color missing", "globalEmbroideryThread": "Embroidery color missing", "leatherColors.secondary": "Secondary leather color missing"}}	f	\N	\N	\N
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
a03cec99-5ce8-4300-9ffb-48c4565ebf35	59a3ca38727522cdc37780162ea7376f878d7974a4200aecb8a61635555d8b13	2025-01-01 12:15:05.794432-08	20250101201505_add_collection_title_format	\N	\N	2025-01-01 12:15:05.783963-08	1
86458d1e-e8b0-4757-881c-fe73cbdaadda	c597a28f9638ecf08b82c0b43ff8a7a0c165619e49260c916be5a6d870dbdcea	2024-10-26 14:42:59.967402-07	20241016222946_init	\N	\N	2024-10-26 14:42:59.964687-07	1
c33adc02-4986-40e9-94e1-eb38fd250d83	06dd58fc327e6902eed34854da0d032e578ffd9658f9f318d71136eed42cd685	2024-10-26 14:51:42.608504-07	20241026215142_remove_thread_table	\N	\N	2024-10-26 14:51:42.604664-07	1
974c7b9b-8390-4bda-9c35-1b7f6d3fed1f	7ce603a720c92f84e70e45c98122923b7172c8f524c2645c6f4941f233493555	2024-10-26 14:42:59.969883-07	20241017012252_init	\N	\N	2024-10-26 14:42:59.967824-07	1
6c1b2412-15a3-4915-9471-93cc43e2f10f	d06b048aedc8e30760adae96ef30be09f05080ee26d72efdf93c239ea7254b81	2024-10-26 14:42:59.973323-07	20241017021338_add_new_models	\N	\N	2024-10-26 14:42:59.970285-07	1
632f1c16-3e11-4ccd-a258-158bffa8ca46	18359ead70632b175bcda4abdda9dd47be94d13ad432f842d45587ac46eab7b7	2024-12-31 00:52:24.388578-08	20241231085224_style_mapping_to_visual_layer	\N	\N	2024-12-31 00:52:24.384963-08	1
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
b219ad3b-094a-4649-8aba-a86df9a3cd87	1321159b7622c0a9fbf1b4fd17f1121461d6548fec49b64b5a8df23a5a7fd563	2024-12-31 09:06:57.615715-08	20241231170657_add_collection_visibility	\N	\N	2024-12-31 09:06:57.613635-08	1
4d3347a1-eece-4faf-883d-0054f975af0e	b3dae6219bb50951ed03532ff41ab33cf47f691efa25cb099948567c8713e4d0	2024-10-26 14:43:00.006765-07	20241026205619_split_thread_tables	\N	\N	2024-10-26 14:42:59.998633-07	1
b1b0ab09-de15-48f1-b0d2-b287d58afdef	a87794d90e31402d6695ca178f954fa8fef5ba55a656056e7a4e3269101839fa	2024-11-02 16:34:48.983128-07	20241102233448_rename_product_type_column_to_offering_type	\N	\N	2024-11-02 16:34:48.98165-07	1
fd21332d-2814-4473-ba30-102f2280605b	fcafe06c48792a6ffdde0e307c83a14e5d52a2718c4f422adc21872174c4be55	2024-12-16 14:25:15.414978-08	20241216222515_isacrd_optional	\N	\N	2024-12-16 14:25:15.407224-08	1
90ed7ee3-2e35-46a2-978c-a3bde145c7da	dbaf1dea3362b30d40bfc8ba77fe19b3e7c2c917a9a8ed6206619810176c61f6	2024-12-21 14:27:24.362062-08	20241221222724_add_base_sku	\N	\N	2024-12-21 14:27:24.360045-08	1
d5e57703-d52c-417b-94cc-a25399eddd2a	de1a9e559de06b1249112e55e6840e65fb7c5f516b9c83c09f94c18ebd48deb4	2024-12-31 09:49:54.088761-08	20241231174954_modify_collection_style_logic	\N	\N	2024-12-31 09:49:54.084041-08	1
04c3c200-4e75-48d6-8fe2-a6e088831c2b	cbf665bb6719f9b29aa643f709657f49cb9208126a02d28a568788955c77d6fd	2024-12-30 11:22:56.888566-08	20241230192256_add_style_collections	\N	\N	2024-12-30 11:22:56.878499-08	1
1e601782-9224-4eae-915c-c4a730995e0b	cde07891978d003eeb29cb6a7a7492160422ace7d7f34720116db37b1856955e	2025-01-01 12:24:12.082201-08	20250101202412_add_style_title_templates	\N	\N	2025-01-01 12:24:12.079932-08	1
ce2d3be1-af96-44bb-b994-2b0c15c4318c	3fc0f0f341b4c19d6c2adaf830b4024376a2be38bfaecb920837fa177d5ae066	2024-12-31 15:11:21.42165-08	20241231231121_added_needsstyle_to_collection	\N	\N	2024-12-31 15:11:21.419439-08	1
c72df74b-6315-4ea1-9d59-ad19dafcbb43	e45164c2c35b97d48d465e78f2fde2a3fa64869b3ef04af138efe81da358c457	2025-01-01 10:57:48.028334-08	20250101185748_add_descriptions_to_collections	\N	\N	2025-01-01 10:57:48.020514-08	1
8bdb218a-b041-4052-809a-9afa6044baee	5de4dec5e50e3ae44e7ef476297bb3f48a0c50bcb898c306a389b4ed4b25ae1e	2025-01-13 18:13:22.462477-08	20250114021322_rename_skuprefix_to_skutemplate	\N	\N	2025-01-13 18:13:22.459297-08	1
627a79d8-2247-41b5-ad0b-efa744f45993	42169a55d283a85b699f28255a57a58a03c914795ceccdc980b9164ef8808aa7	2025-01-02 17:03:45.173621-08	20250103010345_add_display_order_and_shape_type_to_shape	\N	\N	2025-01-02 17:03:45.170444-08	1
51001972-8cab-45d9-8dba-ce62421f8b06	a30fe6c19539dc3d09df5b970059ece5cd4be9735fdb28fe3d909fe8c4a1dea1	2025-01-01 22:40:20.136646-08	20250102064020_addsku_prefix_field_to_collections	\N	\N	2025-01-01 22:40:20.132891-08	1
a08541bc-3054-466e-9857-f57c8068269c	cc479d5be9e19f93acc8d14c1a17a5c276d2c283d839532ba4972c5b754c2e7d	2025-01-02 16:06:59.730134-08	20250103000659_addthread_type_enum_to_collection	\N	\N	2025-01-02 16:06:59.72583-08	1
b3dc7591-eb3e-49a5-a39e-1afe6b4bd0d8	4cc399be90ae4156cbd680b96f5bb7a753203caa5f90995ad2edf0535e46bf86	2025-01-13 15:13:16.752943-08	20250113231316_modify_qclassicfield_to_colordesignation	\N	\N	2025-01-13 15:13:16.748776-08	1
fa2e0a85-8004-4b94-b0cd-97f4285f99d0	efa76e06e6bc4cf3f292467b0365ec3f0dd405c70bca47a923b338bf20e5afbb	2025-01-11 18:44:43.058914-08	20250112024443_qclassic_leather_phrase	\N	\N	2025-01-11 18:44:43.055612-08	1
4546430b-245b-4462-947a-8a7d85ae24c5	41b8765007b59bbf0a0db8d742d3c8ae8ea203a58b772a853a6280fe47458847	2025-01-13 18:54:02.009481-08	20250114025402_add_style_name_pattern	\N	\N	2025-01-13 18:54:02.005197-08	1
4147be5c-e28a-4842-b394-f3f0b1f3c48b	5d92e82d130e2c0c316acf0a5d3049618bb3bf3759608e6f471459d3c5dbd888	2025-01-13 19:09:46.407959-08	20250114030946_rename_image_url_to_url_id	\N	\N	2025-01-13 19:09:46.405935-08	1
8b030e4f-c18c-46ff-add9-11e4ad3f67ad	2fbcafce01e25fa2d3e20de672dbeb33a41909f524d20bd7f059a23f4069ba0d	2025-01-21 18:38:14.571349-08	20250122023814_switching_product_price_with_price_tier	\N	\N	2025-01-21 18:38:14.563044-08	1
8669b95d-1e13-4f5e-b88b-09f1dc1c5637	173dffe1d96e0e5caa64c5411b39795fa3af317f1fab4a0a296a857552040a4c	2025-01-22 13:42:05.183798-08	20250122214205_switching_product_price_with_price_tier_part_two	\N	\N	2025-01-22 13:42:05.178696-08	1
119d061f-9e0a-4fa3-8099-a861f9c0732a	35a02b7464d6c640e6e535e3062235e39d143b21a4bf622aed2d7193c94379f6	2025-01-22 14:32:59.518364-08	20250122223259_switching_product_price_with_price_tier_part_three	\N	\N	2025-01-22 14:32:59.513768-08	1
c56601a6-5528-4203-81da-c845685d2899	6092cb8dc191b0c3aed524c2e4dc79321c2c16cae5ce19793bde9445586bff95	2025-01-22 22:34:28.40208-08	20250123063428_add_many_to_many_amann	\N	\N	2025-01-22 22:34:28.391018-08	1
83037a71-aa3a-4a86-9e1e-f248131696de	ea74d08fb46fd9188e9d015939da920416ca70b37433812218e31241dec072ba	2025-01-23 00:31:13.293329-08	20250123083113_update_thread_relations	\N	\N	2025-01-23 00:31:13.284046-08	1
549d31b8-a52c-44c8-ab03-d9fa2d480a43	753b655e50adfabf3d40b69b3a36cbf095a17d8d83d28ce50a867bba0c6de3eb	2025-02-03 07:45:52.673227-08	20250203154552_remap_product_data_lpc_and_threads	\N	\N	2025-02-03 07:45:52.654602-08	1
68bbf97b-a012-4a4f-a9df-52ce66591278	afda23f5caa68127974080ce450e35bd430019f7ff9f7615b6d85c5eabb35231	2025-02-04 20:01:56.998658-08	20250205040156_expanding_isacord_for_custom	\N	\N	2025-02-04 20:01:56.992102-08	1
\.


--
-- Name: AmannNumber AmannNumber_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."AmannNumber"
    ADD CONSTRAINT "AmannNumber_pkey" PRIMARY KEY (id);


--
-- Name: CollectionTitleFormat CollectionTitleFormat_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."CollectionTitleFormat"
    ADD CONSTRAINT "CollectionTitleFormat_pkey" PRIMARY KEY (id);


--
-- Name: ColorTag ColorTag_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ColorTag"
    ADD CONSTRAINT "ColorTag_pkey" PRIMARY KEY (id);


--
-- Name: CommonDescription CommonDescription_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."CommonDescription"
    ADD CONSTRAINT "CommonDescription_pkey" PRIMARY KEY (id);


--
-- Name: EmbroideryThread EmbroideryThread_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."EmbroideryThread"
    ADD CONSTRAINT "EmbroideryThread_pkey" PRIMARY KEY (id);


--
-- Name: Font Font_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Font"
    ADD CONSTRAINT "Font_pkey" PRIMARY KEY (id);


--
-- Name: IsacordNumber IsacordNumber_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."IsacordNumber"
    ADD CONSTRAINT "IsacordNumber_pkey" PRIMARY KEY (id);


--
-- Name: LeatherColor LeatherColor_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."LeatherColor"
    ADD CONSTRAINT "LeatherColor_pkey" PRIMARY KEY (id);


--
-- Name: PriceTier PriceTier_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PriceTier"
    ADD CONSTRAINT "PriceTier_pkey" PRIMARY KEY (id);


--
-- Name: ProductDataLPC ProductDataLPC_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ProductDataLPC"
    ADD CONSTRAINT "ProductDataLPC_pkey" PRIMARY KEY (id);


--
-- Name: ProductStitching ProductStitching_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ProductStitching"
    ADD CONSTRAINT "ProductStitching_pkey" PRIMARY KEY (id);


--
-- Name: Session Session_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Session"
    ADD CONSTRAINT "Session_pkey" PRIMARY KEY (id);


--
-- Name: ShapeTypeAdjustment ShapeTypeAdjustment_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ShapeTypeAdjustment"
    ADD CONSTRAINT "ShapeTypeAdjustment_pkey" PRIMARY KEY (id);


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
-- Name: StitchingThread StitchingThread_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."StitchingThread"
    ADD CONSTRAINT "StitchingThread_pkey" PRIMARY KEY (id);


--
-- Name: StyleCollection StyleCollection_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."StyleCollection"
    ADD CONSTRAINT "StyleCollection_pkey" PRIMARY KEY (id);


--
-- Name: Style Style_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Style"
    ADD CONSTRAINT "Style_pkey" PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: AmannNumber_threadId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "AmannNumber_threadId_idx" ON public."AmannNumber" USING btree ("threadId");


--
-- Name: CollectionTitleFormat_collectionId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "CollectionTitleFormat_collectionId_idx" ON public."CollectionTitleFormat" USING btree ("collectionId");


--
-- Name: CollectionTitleFormat_collectionId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "CollectionTitleFormat_collectionId_key" ON public."CollectionTitleFormat" USING btree ("collectionId");


--
-- Name: ColorTag_name_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "ColorTag_name_key" ON public."ColorTag" USING btree (name);


--
-- Name: CommonDescription_name_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "CommonDescription_name_key" ON public."CommonDescription" USING btree (name);


--
-- Name: IsacordNumber_threadId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IsacordNumber_threadId_idx" ON public."IsacordNumber" USING btree ("threadId");


--
-- Name: ProductDataLPC_collectionId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ProductDataLPC_collectionId_idx" ON public."ProductDataLPC" USING btree ("collectionId");


--
-- Name: ProductDataLPC_colorDesignationId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ProductDataLPC_colorDesignationId_idx" ON public."ProductDataLPC" USING btree ("colorDesignationId");


--
-- Name: ProductDataLPC_embroideryThreadId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ProductDataLPC_embroideryThreadId_idx" ON public."ProductDataLPC" USING btree ("embroideryThreadId");


--
-- Name: ProductDataLPC_fontId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ProductDataLPC_fontId_idx" ON public."ProductDataLPC" USING btree ("fontId");


--
-- Name: ProductDataLPC_isacordId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ProductDataLPC_isacordId_idx" ON public."ProductDataLPC" USING btree ("isacordId");


--
-- Name: ProductDataLPC_leatherColor1Id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ProductDataLPC_leatherColor1Id_idx" ON public."ProductDataLPC" USING btree ("leatherColor1Id");


--
-- Name: ProductDataLPC_leatherColor2Id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ProductDataLPC_leatherColor2Id_idx" ON public."ProductDataLPC" USING btree ("leatherColor2Id");


--
-- Name: ProductDataLPC_shapeId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ProductDataLPC_shapeId_idx" ON public."ProductDataLPC" USING btree ("shapeId");


--
-- Name: ProductDataLPC_styleId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ProductDataLPC_styleId_idx" ON public."ProductDataLPC" USING btree ("styleId");


--
-- Name: ProductStitching_amannId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ProductStitching_amannId_idx" ON public."ProductStitching" USING btree ("amannId");


--
-- Name: ProductStitching_productDataLPCId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ProductStitching_productDataLPCId_idx" ON public."ProductStitching" USING btree ("productDataLPCId");


--
-- Name: ProductStitching_stitchingThreadId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ProductStitching_stitchingThreadId_idx" ON public."ProductStitching" USING btree ("stitchingThreadId");


--
-- Name: ShopifyCollections_handle_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "ShopifyCollections_handle_key" ON public."ShopifyCollections" USING btree (handle);


--
-- Name: ShopifyCollections_priceTierId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "ShopifyCollections_priceTierId_key" ON public."ShopifyCollections" USING btree ("priceTierId");


--
-- Name: StyleCollection_collectionId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "StyleCollection_collectionId_idx" ON public."StyleCollection" USING btree ("collectionId");


--
-- Name: StyleCollection_styleId_collectionId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "StyleCollection_styleId_collectionId_key" ON public."StyleCollection" USING btree ("styleId", "collectionId");


--
-- Name: StyleCollection_styleId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "StyleCollection_styleId_idx" ON public."StyleCollection" USING btree ("styleId");


--
-- Name: _EmbroideryThreadToTag_AB_unique; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "_EmbroideryThreadToTag_AB_unique" ON public."_EmbroideryThreadToTag" USING btree ("A", "B");


--
-- Name: _EmbroideryThreadToTag_B_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "_EmbroideryThreadToTag_B_index" ON public."_EmbroideryThreadToTag" USING btree ("B");


--
-- Name: _LeatherColorToTag_AB_unique; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "_LeatherColorToTag_AB_unique" ON public."_LeatherColorToTag" USING btree ("A", "B");


--
-- Name: _LeatherColorToTag_B_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "_LeatherColorToTag_B_index" ON public."_LeatherColorToTag" USING btree ("B");


--
-- Name: _StitchingThreadToTag_AB_unique; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "_StitchingThreadToTag_AB_unique" ON public."_StitchingThreadToTag" USING btree ("A", "B");


--
-- Name: _StitchingThreadToTag_B_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "_StitchingThreadToTag_B_index" ON public."_StitchingThreadToTag" USING btree ("B");


--
-- Name: AmannNumber AmannNumber_threadId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."AmannNumber"
    ADD CONSTRAINT "AmannNumber_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES public."StitchingThread"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: CollectionTitleFormat CollectionTitleFormat_collectionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."CollectionTitleFormat"
    ADD CONSTRAINT "CollectionTitleFormat_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES public."ShopifyCollections"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: IsacordNumber IsacordNumber_threadId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."IsacordNumber"
    ADD CONSTRAINT "IsacordNumber_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES public."EmbroideryThread"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ProductDataLPC ProductDataLPC_collectionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ProductDataLPC"
    ADD CONSTRAINT "ProductDataLPC_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES public."ShopifyCollections"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ProductDataLPC ProductDataLPC_colorDesignationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ProductDataLPC"
    ADD CONSTRAINT "ProductDataLPC_colorDesignationId_fkey" FOREIGN KEY ("colorDesignationId") REFERENCES public."LeatherColor"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ProductDataLPC ProductDataLPC_embroideryThreadId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ProductDataLPC"
    ADD CONSTRAINT "ProductDataLPC_embroideryThreadId_fkey" FOREIGN KEY ("embroideryThreadId") REFERENCES public."EmbroideryThread"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ProductDataLPC ProductDataLPC_fontId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ProductDataLPC"
    ADD CONSTRAINT "ProductDataLPC_fontId_fkey" FOREIGN KEY ("fontId") REFERENCES public."Font"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ProductDataLPC ProductDataLPC_isacordId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ProductDataLPC"
    ADD CONSTRAINT "ProductDataLPC_isacordId_fkey" FOREIGN KEY ("isacordId") REFERENCES public."IsacordNumber"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ProductDataLPC ProductDataLPC_leatherColor1Id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ProductDataLPC"
    ADD CONSTRAINT "ProductDataLPC_leatherColor1Id_fkey" FOREIGN KEY ("leatherColor1Id") REFERENCES public."LeatherColor"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ProductDataLPC ProductDataLPC_leatherColor2Id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ProductDataLPC"
    ADD CONSTRAINT "ProductDataLPC_leatherColor2Id_fkey" FOREIGN KEY ("leatherColor2Id") REFERENCES public."LeatherColor"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ProductDataLPC ProductDataLPC_shapeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ProductDataLPC"
    ADD CONSTRAINT "ProductDataLPC_shapeId_fkey" FOREIGN KEY ("shapeId") REFERENCES public."Shape"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ProductDataLPC ProductDataLPC_styleId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ProductDataLPC"
    ADD CONSTRAINT "ProductDataLPC_styleId_fkey" FOREIGN KEY ("styleId") REFERENCES public."Style"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ProductStitching ProductStitching_amannId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ProductStitching"
    ADD CONSTRAINT "ProductStitching_amannId_fkey" FOREIGN KEY ("amannId") REFERENCES public."AmannNumber"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ProductStitching ProductStitching_productDataLPCId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ProductStitching"
    ADD CONSTRAINT "ProductStitching_productDataLPCId_fkey" FOREIGN KEY ("productDataLPCId") REFERENCES public."ProductDataLPC"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ProductStitching ProductStitching_stitchingThreadId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ProductStitching"
    ADD CONSTRAINT "ProductStitching_stitchingThreadId_fkey" FOREIGN KEY ("stitchingThreadId") REFERENCES public."StitchingThread"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ShapeTypeAdjustment ShapeTypeAdjustment_tierId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ShapeTypeAdjustment"
    ADD CONSTRAINT "ShapeTypeAdjustment_tierId_fkey" FOREIGN KEY ("tierId") REFERENCES public."PriceTier"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ShopifyCollections ShopifyCollections_priceTierId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ShopifyCollections"
    ADD CONSTRAINT "ShopifyCollections_priceTierId_fkey" FOREIGN KEY ("priceTierId") REFERENCES public."PriceTier"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: StyleCollection StyleCollection_collectionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."StyleCollection"
    ADD CONSTRAINT "StyleCollection_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES public."ShopifyCollections"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: StyleCollection StyleCollection_styleId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."StyleCollection"
    ADD CONSTRAINT "StyleCollection_styleId_fkey" FOREIGN KEY ("styleId") REFERENCES public."Style"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: _EmbroideryThreadToTag _EmbroideryThreadToTag_A_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."_EmbroideryThreadToTag"
    ADD CONSTRAINT "_EmbroideryThreadToTag_A_fkey" FOREIGN KEY ("A") REFERENCES public."ColorTag"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: _EmbroideryThreadToTag _EmbroideryThreadToTag_B_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."_EmbroideryThreadToTag"
    ADD CONSTRAINT "_EmbroideryThreadToTag_B_fkey" FOREIGN KEY ("B") REFERENCES public."EmbroideryThread"(id) ON UPDATE CASCADE ON DELETE CASCADE;


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
-- Name: _StitchingThreadToTag _StitchingThreadToTag_A_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."_StitchingThreadToTag"
    ADD CONSTRAINT "_StitchingThreadToTag_A_fkey" FOREIGN KEY ("A") REFERENCES public."ColorTag"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: _StitchingThreadToTag _StitchingThreadToTag_B_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."_StitchingThreadToTag"
    ADD CONSTRAINT "_StitchingThreadToTag_B_fkey" FOREIGN KEY ("B") REFERENCES public."StitchingThread"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: postgres
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- PostgreSQL database dump complete
--

