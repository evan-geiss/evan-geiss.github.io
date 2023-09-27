async function displayGitHubRepositories() {
    const username = 'evan-geiss'; // Replace with Evan's GitHub username
    const url = `https://api.github.com/users/${username}/repos`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (response.ok) {
            const repositoriesContainer = document.getElementById('github-repositories');

            // Loop through the repositories
            data.forEach(async (repository) => {
                // Create a container for each repository
                const repoContainer = document.createElement('div');
                repoContainer.classList.add('repository-container');

                // Create a link to the repository
                const repoLink = document.createElement('a');
                repoLink.href = repository.html_url;
                repoLink.textContent = repository.name;
                repoLink.target = '_blank';
                repoContainer.appendChild(repoLink);

                // Create an image for the repository's avatar
                const avatarImg = document.createElement('img');
                avatarImg.src = repository.owner.avatar_url;
                avatarImg.alt = `${repository.owner.login}'s Avatar`;
                repoContainer.appendChild(avatarImg);

                // Fetch the README content
                const readmeUrl = `${repository.url}/readme`;
                const readmeResponse = await fetch(readmeUrl);
                const readmeData = await readmeResponse.json();

                if (readmeResponse.ok) {
                    // Create a div to display the README content
                    const readmeDiv = document.createElement('div');
                    readmeDiv.innerHTML = atob(readmeData.content);
                    repoContainer.appendChild(readmeDiv);
                } else {
                    console.error('Failed to fetch README for', repository.name);
                }

                repositoriesContainer.appendChild(repoContainer);
            });
        } else {
            console.error('Failed to fetch GitHub repositories:', data.message);
        }
    } catch (error) {
        console.error('An error occurred while fetching GitHub repositories:', error);
    }
}

document.querySelectorAll('.nav-link').forEach(item => {
    item.addEventListener('click', () => {
        const navbarToggler = document.querySelector('.navbar-toggler');
        if (navbarToggler.getAttribute('aria-expanded') === 'true') {
            navbarToggler.click();
        }
    });
});

// Call the function to display GitHub repositories
displayGitHubRepositories();
