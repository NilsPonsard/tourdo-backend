create table if not exists tournaments
(
    id          serial
        constraint tournaments_pk
            primary key,
    type        int,
    name        text,
    description text,
    start_date  date,
    end_date    date,
    status      int,
    max_teams int,
    game_name  text
);

create unique index if not exists tournaments_id_uindex
    on tournaments (id);

