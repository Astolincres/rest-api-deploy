const express = require("express"); // require => commonJS
const crypto = require("node:crypto"); // require => commonJS
const cors = require("cors"); // require => commonJS
const movies = require("./movies.json");
const { validateMovie, validatePartialMovie } = require("./schemas/movies");


const app = express(); // app is an object with methods
app.use(express.json()); // this is a middleware, it parses the body of the request and adds it to the req.body object
app.use(cors({
    origin: (origin, cb) => {
        const ACCEPTED_ORIGINS = [
            "http://localhost:8080", 
            "http://localhost:1234",
            "https://movies.com/",
            "https://midu.dev",
        ];
        if (ACCEPTED_ORIGINS.includes(origin) || !origin) {
            return cb(null, true);
        }
        
        return cb(new Error("Not allowed by CORS"));
    }
})); // this is a middleware, it adds the cors headers to the response add an * to the origin header, have to put options
app.disable("x-powered-by"); // disable x-powered-by header by express

// normal methods: GET/HEAD/POST
// idempotent methods: PUT/PATCH/DELETE
const ACCEPTED_ORIGINS = [
    "http://localhost:8080", 
    "http://localhost:1234",
    "https://movies.com/",
    "https://midu.dev",
];


app.get("/", (req, res) => {
    res.json({ message: "Hello World" });
});

// this return all movies and using the query param we can filter the movies by genre
app.get("/movies", (req, res) => {
    const origin = req.header("origin");
    // Whet the request comes from another ORIGIN, the browser will send the origin header, if not, it won't send it.
    console.log(origin);
    if (ACCEPTED_ORIGINS.includes(origin) || !origin) {
        res.header("Access-Control-Allow-Origin", origin);
    }
    // query params are in the req.query object
    const { genre } = req.query;
    if (genre) {
        const filteredMovies = movies.filter((movie) => {
            movie.genre.some((g) => g.toLowerCase() === genre.toLowerCase());
            return movie;
        });
        if (filteredMovies) {
            res.json(filteredMovies);
        } else {
            res.status(404).json({ message: "Not movies with that genre" });
        }
    } else {
        res.json(movies);
    }
});

// get movie by id, in this case we use a query param to get the movie, :id is a param, we can access to it with req.params and the name of the param in this case id is used as key to find the movie.
app.get("/movies/:id", (req, res) => {
    const { id } = req.params;
    const movie = movies.find((movie) => movie.id === id);
    if (movie) {
        res.json(movie);
    } else {
        res.status(404).json({ message: "Movie not found" });
    }
});

// get movie by genre, in this case we use a query param to get the movie, :genre is a param, we can access to it with req.params and the name of the param in this case genre is used as key to find the movie.
app.get("/movies/genre/:genre", (req, res) => {
    const { genre } = req.params;
    const moviesJson = movies.filter((movie) => {
        movie.genre.some((g) => g.toLowerCase() === genre.toLowerCase());
        return movie;
    });
    if (moviesJson) {
        res.json(moviesJson);
    } else {
        res.status(404).json({ message: "Not movies with that genre" });
    }
});

// get movie by director, if contains the director name in the director array, it will return the movie
app.get("/movies/director/:director", (req, res) => {
    const { director } = req.params;
    const moviesJson = movies.filter((movie) => movie.director.toLowerCase().includes(director.toLowerCase()));

    // remember to do this when you have only one line in the if statement.
    if (moviesJson) return res.json(moviesJson);
    // this doesn't require an else statement because if the if statement is true, it will return the response and the function will end and if not it will continue to the next line of code that returns the 404 status.
    res.status(404).json({ message: "Movie not found" });
    // if (moviesJson) {
    //     res.json(moviesJson);
    // } else {
    //     res.status(404).json({ message: "Movie not found" });
    // }
});

app.post("/movies", (req, res) => {
    console.log("Hello");
    const result = validateMovie(req.body);
    console.log(result.error);
    if (result.error) {
        // we can use 422 too
        return res.status(400).json({ error: JSON.parse(result.error.message) });
    }

    // with validateMovie we can use ...result.data to get the data from the object already validate
    const newMovie = {
        id: crypto.randomUUID(),
        ...result.data,
    };
    // const { title, year, director, duration, poster, genre, rate } = req.body;
    // const newMovie = {
    //     id: crypto.randomUUID(),
    //     title,
    //     year,
    //     director,
    //     duration,
    //     poster,
    //     genre,
    //     rate: rate ?? 0,
    // };
    movies.push(newMovie);
    res.status(201).json(newMovie);
});

app.delete("/movies/:id", (req, res) => {
    const origin = req.header("origin");
    // Whet the request comes from another ORIGIN, the browser will send the origin header, if not, it won't send it.
    console.log(origin);
    if (ACCEPTED_ORIGINS.includes(origin) || !origin) {
        res.header("Access-Control-Allow-Origin", origin);
    }

    const { id } = req.params;
    const movieIndex = movies.findIndex((movie) => movie.id === id);
    if (movieIndex === -1) {
        return res.status(404).json({ message: "Movie not found" });
    }
    movies.splice(movieIndex, 1);
    res.status(204).json({ meesage : "Movie deleted"});
});

// can't validate id because it's not in the schema
app.patch("/movies/:id", (req, res) => {
    const result = validatePartialMovie(req.body);

    if (result.error) {
        return res.status(400).json({ error: JSON.parse(result.error.message) });
    }

    const { id } = req.params;
    const movieIndex = movies.findIndex((movie) => movie.id === id);
    if (movieIndex === -1) {
        return res.status(404).json({ message: "Movie not found" });
    }

    
    const updateMovie = { ...movies[movieIndex], ...result.data };
    movies[movieIndex] = updateMovie;
    res.json(updateMovie);
}); 

app.options("/movies/:id", (req, res) => {
    const origin = req.header("origin");
    if (ACCEPTED_ORIGINS.includes(origin) || !origin) {
        res.header("Access-Control-Allow-Origin", origin);
        res.header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
    }
    res.send();
});

const PORT = process.env.PORT ?? 1234;

app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
