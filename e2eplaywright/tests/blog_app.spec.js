const { test, describe, expect, beforeEach } = require('@playwright/test')
const { loginWith, createBlog } = require('./helper')

// npm test -- --project chromium
// playwright test --ui
// npm test -- --ui
// npm run test -- --trace on
// These open ui :
//  npx playwright test --headed 
/*  npm test -- -g'a new blog can be created' --debug
       then add this in a line of test: await page.pause() */
describe('Blog app', () => {
    beforeEach(async ({page, request}) => {
        await request.post('/api/testing/reset')
        await request.post('/api/users', {
            data: {
                username: 'wdijkstra',
                name: 'Edsger W. Dijkstra',
                password: '2025-wdi'
            }
        })

        await page.goto('/')
    })

    test('login fails with wrong password', async ({page}) => {
        await loginWith(page, 'wdijkstra', 'wrong')

        const errorDiv = page.locator('.failed')
        await expect(errorDiv).toContainText('Wrong credentials')
    })

    test('front page can be opened', async ({page}) => {
        const locator = await page.getByText('blogs')
        await expect(locator).toBeVisible()
        await page.getByRole('button', { name: 'login'}).click()
    })

    test('login form can be opened', async ({page}) => {
        // another way for testing username and password
        // const textboxes = await page.getByRole('textbox').all()
        // await textboxes[0].fill('wdijkstra')
        // await textboxes[1].fill('2025-wdi')

        // another way for testing  username and password
        // await page.getByRole('textbox').first().fill('wdijkstra')
        // await page.getByRole('textbox').last().fill('2025-wdi')

        // await page.pause()
        await loginWith(page, 'wdijkstra', '2025-wdi')
        await expect(page.getByText('Edsger W. Dijkstra logged in.')).toBeVisible()
    })

    describe('when login', () => {
        beforeEach(async ({page}) => {
            await loginWith(page, 'wdijkstra', '2025-wdi')
        })

        test('a new blog can be created', async ({page}) => {
            await createBlog(page, 'Ceramic First class', 'Ennio C. Mattioli', 'https://ceramicstudio.ca/upcoming-courses/')
            await expect(page.locator('[data-testid="blogTitle"]')).toBeVisible()
        })

        describe('and a blog exists', () => {
            beforeEach(async ({page}) => {
                await createBlog(page, 'First class tests', 'Robert C. Martin', 'http://blog.cleancoder.com/uncle-bob/2017/05/05/TestDefinitions.html')
            })

            test('likes can be incremented', async ({page}) => {
                await page.getByRole('button', { name: 'view'}).click()

                const likesElement = await page.locator('p', { hasText: 'likes' }).first()
                const initialLikesText = await likesElement.textContent()
                const initialLikes = parseInt(initialLikesText.split(' ')[1])

                await page.getByRole('button', { name: 'like'}).click()

                await page.waitForTimeout(500);

                const updatedLikesText = await page.locator('p', { hasText: 'likes' }).first().textContent();
                const updatedLikes = parseInt(updatedLikesText.split(' ')[1]);

                expect(updatedLikes).toBe(initialLikes + 1);
            })

            test('a blog can be deleted', async ({page}) => {
                const initialBlogCount = await page.getByTestId('blogDiv').count()
                const blogsDivs = page.getByTestId('blogDiv')
                const blog = await blogsDivs.first()

                await blog.getByRole('button', { name : 'view'}).click()

                await page.on('dialog', async dialog => {
                    expect(dialog.message()).toContain('Remove blog')
                    await dialog.accept()
                })

                await blog.getByRole('button', { name: 'remove' }).click()

                const successDiv = await page.locator('.success')
                await expect(successDiv).toContainText('blog')

                const updatedBlogsDivs = await page.getByTestId('blogDiv')

                if (initialBlogCount > 1) {
                    await expect(updatedBlogsDivs).toHaveCount(initialBlogCount - 1)
                } else {
                    await expect(updatedBlogsDivs).toHaveCount(0);
                }
                
            })
        })
    })
})
