create table if not exists matches
(
    id            serial
        constraint matches_pk
            primary key,
    team1_id      int not null
        constraint matches_team1__fk
            references teams,
    team2_id      int not null
        constraint matches_team2__fk
            references teams,
    row           int,
    "column"      int,
    tournament_id serial
        constraint matches_tournament_id_fk
            references tournaments,
    winner_id     int
        constraint matches_winner_id_fk
            references teams,
    date          date
);

create unique index if not exists matches_id_uindex
    on matches (id);

