INSERT INTO "farm_zones" ("code", "name", "width_m", "length_m")
VALUES ('FL11', 'Front Left 11', 5, 3)
ON CONFLICT ("code") DO NOTHING;
