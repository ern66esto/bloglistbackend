const loginWith = async (page, username, password) => {
    await page.getByRole('button', { name: 'login'}).click()
    await page.getByTestId('username').fill(username)
    await page.getByTestId('password').fill(password)
    await page.getByRole('button', { name: 'login'}).click()
}

const createBlog = async (page, title, author, url) => {
    console.log(`Creating blog: ${title}  `);
    await page.getByRole('button', { name: 'new blog'}).click()
    await page.getByPlaceholder('write title here').fill(title)
    await page.getByPlaceholder('write author here').fill(author)
    await page.getByPlaceholder('write url here').fill(url)
    await page.getByRole('button', { name: 'create'}).click()

    await page.waitForSelector(`[data-testid="blogDiv"]:has-text("${title}")`, { timeout: 5000 })
    console.log(`Blog "${title}" created and visible.`)
}

export { loginWith, createBlog }