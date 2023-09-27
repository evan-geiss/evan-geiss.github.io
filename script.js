// Function to fetch and display GitHub repositories
async function displayGitHubRepositories() {
    const username = 'evan-geiss'; // Replace with Evan's GitHub username
    const url = `https://api.github.com/users/${username}/repos`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (response.ok) {
            const repositoriesContainer = document.getElementById('github-repositories');

            // Loop through the repositories and create HTML elements to display them
            data.forEach(repository => {
                const repoLink = document.createElement('a');
                repoLink.href = repository.html_url;
                repoLink.textContent = repository.name;
                repoLink.target = '_blank';

                repositoriesContainer.appendChild(repoLink);
                repositoriesContainer.appendChild(document.createElement('br'));
            });
        } else {
            console.error('Failed to fetch GitHub repositories:', data.message);
        }
    } catch (error) {
        console.error('An error occurred while fetching GitHub repositories:', error);
    }
}

// Call the function to display GitHub repositories
displayGitHubRepositories();
