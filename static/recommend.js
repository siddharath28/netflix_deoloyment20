document.addEventListener('DOMContentLoaded', function () {
    const source = document.getElementById('autoComplete');
    const movieButton = document.querySelector('.movie-button');
    const movieInput = document.querySelector('.movie');
    const resultsDiv = document.querySelector('.results');
    const failDiv = document.querySelector('.fail');
    const loader = document.getElementById('loader');

    source.addEventListener('input', function (e) {
        movieButton.disabled = e.target.value === "";
    });

    movieButton.addEventListener('click', function () {
        const apiKey = 'd0615927cc35854b78be7f1afd4bc022';
        const title = movieInput.value.trim();
        if (title === "") {
            resultsDiv.style.display = 'none';
            failDiv.style.display = 'block';
        } else {
            loadDetails(apiKey, title);
        }
    });

    async function loadDetails(apiKey, title) {
        try {
            const response = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${title}`);
            const movie = await response.json();
            if (movie.results.length < 1) {
                failDiv.style.display = 'block';
                resultsDiv.style.display = 'none';
                setTimeout(() => loader.style.display = 'none', 500);
            } else {
                loader.style.display = 'block';
                failDiv.style.display = 'none';
                resultsDiv.style.display = 'block';
                const movieId = movie.results[0].id;
                const movieTitle = movie.results[0].original_title;
                movieRecs(movieTitle, movieId, apiKey);
            }
        } catch (error) {
            alert('Invalid Request');
            setTimeout(() => loader.style.display = 'none', 500);
        }
    }

    async function movieRecs(movieTitle, movieId, apiKey) {
        try {
            const response = await fetch('/similarity', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name: movieTitle })
            });
            const recs = await response.text();
            if (recs === "Sorry! The movie you requested is not in our database. Please check the spelling or try with some other movies") {
                failDiv.style.display = 'block';
                resultsDiv.style.display = 'none';
                setTimeout(() => loader.style.display = 'none', 500);
            } else {
                failDiv.style.display = 'none';
                resultsDiv.style.display = 'block';
                const movieArr = recs.split('---');
                getMovieDetails(movieId, apiKey, movieArr, movieTitle);
            }
        } catch (error) {
            alert("Error with recommendations");
            setTimeout(() => loader.style.display = 'none', 500);
        }
    }

    async function getMovieDetails(movieId, apiKey, arr, movieTitle) {
        try {
            const response = await fetch(`https://api.themoviedb.org/3/movie/${movieId}?api_key=${apiKey}`);
            const movieDetails = await response.json();
            showDetails(movieDetails, arr, movieTitle, apiKey, movieId);
        } catch (error) {
            alert("API Error!");
            setTimeout(() => loader.style.display = 'none', 500);
        }
    }

    async function showDetails(movieDetails, arr, movieTitle, apiKey, movieId) {
        const imdbId = movieDetails.imdb_id;
        const poster = `https://image.tmdb.org/t/p/original${movieDetails.poster_path}`;
        const overview = movieDetails.overview;
        const genres = movieDetails.genres.map(genre => genre.name).join(", ");
        let runtime = movieDetails.runtime;
        if (runtime % 60 === 0) {
            runtime = `${Math.floor(runtime / 60)} hour(s)`;
        } else {
            runtime = `${Math.floor(runtime / 60)} hour(s) ${runtime % 60} min(s)`;
        }
        const details = {
            title: movieTitle,
            cast_ids: JSON.stringify(await getMovieCast(movieId, apiKey)),
            cast_names: JSON.stringify(movie_cast.cast_names),
            cast_chars: JSON.stringify(movie_cast.cast_chars),
            cast_profiles: JSON.stringify(movie_cast.cast_profiles),
            cast_bdays: JSON.stringify(ind_cast.cast_bdays),
            cast_bios: JSON.stringify(ind_cast.cast_bios),
            cast_places: JSON.stringify(ind_cast.cast_places),
            imdb_id: imdbId,
            poster: poster,
            genres: genres,
            overview: overview,
            rating: movieDetails.vote_average,
            vote_count: movieDetails.vote_count.toLocaleString(),
            release_date: new Date(movieDetails.release_date).toDateString().split(' ').slice(1).join(' '),
            runtime: runtime,
            status: movieDetails.status,
            rec_movies: JSON.stringify(arr),
            rec_posters: JSON.stringify(await getMoviePosters(arr, apiKey))
        };

        try {
            const response = await fetch('/recommend', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(details)
            });
            const htmlResponse = await response.text();
            resultsDiv.innerHTML = htmlResponse;
            source.value = '';
            window.scrollTo(0, 0);
        } catch (error) {
            alert("Error displaying details");
            setTimeout(() => loader.style.display = 'none', 500);
        }
    }

    async function getMovieCast(movieId, apiKey) {
        try {
            const response = await fetch(`https://api.themoviedb.org/3/movie/${movieId}/credits?api_key=${apiKey}`);
            const credits = await response.json();
            const topCast = credits.cast.slice(0, 10);
            const castDetails = {
                cast_ids: topCast.map(cast => cast.id),
                cast_names: topCast.map(cast => cast.name),
                cast_chars: topCast.map(cast => cast.character),
                cast_profiles: topCast.map(cast => `https://image.tmdb.org/t/p/original${cast.profile_path}`)
            };
            return castDetails;
        } catch (error) {
            alert("Invalid Request!");
            setTimeout(() => loader.style.display = 'none', 500);
        }
    }

    async function getMoviePosters(arr, apiKey) {
        const posterList = [];
        for (const movie of arr) {
            try {
                const response = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${movie}`);
                const data = await response.json();
                posterList.push(`https://image.tmdb.org/t/p/original${data.results[0].poster_path}`);
            } catch (error) {
                alert("Invalid Request!");
                setTimeout(() => loader.style.display = 'none', 500);
            }
        }
        return posterList;
    }
});
