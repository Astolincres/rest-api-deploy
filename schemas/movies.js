const z = require("zod");

const movieSchema = z.object({
    title: z.string({
        invalid_type_error: "Movie title must be a string",
        required_error: "Movie title is required",
    }),
    year: z
        .number({
            invalid_type_error: "Movie year must be a number",
            required_error: "Movie year is required",
        })
        .int()
        .min(1900)
        .max(2024),
    director: z.string(),
    duration: z.number().int().positive(),
    rate: z.number().min(0).max(10).default(5 ),
    poster: z.string().url({ message: "poster poster must be a valid url" }).endsWith(".jpg"),
    genre: z.array(z.enum(["Action", "Adventure", "Animation", "Biography", "Comedy", "Crime", "Drama", "Family", "Fantasy", "History", "Horror", "Musical", "Mystery", "Romance", "Sci-Fi", "Sport", "Thriller", "War", "Western"]), {
        required_error: "Movie genre is required",
        invalidad_type_error: "Movie genre must be a string",
    }),
});

const validateMovie = (input) => {
    // return an object with the errors and the data
    return movieSchema.safeParse(input);
};

function validatePartialMovie(input) {
    return movieSchema.partial().safeParse(input);
}

module.exports = { 
    validateMovie,
    validatePartialMovie
};
