-- Adds the 4-char club code shown on calendar chips.
alter table clubs add column if not exists short text;

update clubs set short = upper(left(replace(slug, '-', ''), 3)) where short is null;
