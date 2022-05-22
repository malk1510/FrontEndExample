class Book{
    constructor(
        numPages,
        chapters,
        pageWords,
        cover,
        bookmarkedPage
    ){
        this.numPages = numPages;
        this.chapters = chapters;
        this.pageWords = pageWords;
        this.cover = cover;
        this.bookmarkedPage = bookmarkedPage;
    }

    bookmark(pageNo){
        this.bookmarkedPage = this.bookmarkedPage;
    }

    goToChap(chapter){
        return this.pageWords[this.chapters[chapter]];
    }
}