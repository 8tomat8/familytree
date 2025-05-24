CREATE TABLE "images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"filename" varchar(255) NOT NULL,
	"original_name" varchar(255),
	"path" varchar(500) NOT NULL,
	"size" integer NOT NULL,
	"width" integer,
	"height" integer,
	"mime_type" varchar(100) NOT NULL,
	"checksum" varchar(64),
	"is_active" boolean DEFAULT true NOT NULL,
	"description" text,
	"tags" text[],
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "images_filename_unique" UNIQUE("filename")
);
