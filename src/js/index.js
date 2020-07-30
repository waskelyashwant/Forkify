import Search from './Models/Search';
import Recipe from './Models/Recipe';
import * as searchView from './Views/searchView';
import * as recipeView from './Views/recipeView';
import * as listView from './Views/listView';
import * as likesView from './Views/likesView';
import { elements, renderLoader, clearLoader } from './Views/base';
import List from './Models/List';
import Likes from './Models/likes';

/* Global state of the app
   - Search object 
   - Current recipe object
   - Shopping list object
   - Liked recipes
*/


const state = {};
window.state = state;

const controlSearch = async () => {
    // 1) Get query from view
    const query = searchView.getInput(); // TODO

    if(query) {
        // 2) New search object and add to state
        state.search = new Search(query);

        // 3) Prepare UI for results
        searchView.clearInput();
        searchView.clearResults();
        renderLoader(elements.searchResult);

        try {
            // 4) Search for recipes
            await state.search.getResults();

            // // 5) Render results on UI
            clearLoader();
            searchView.renderResults(state.search.result);
        }catch(error) {
            //alert('Something wrong with the search...');
            alert(error);
            clearLoader();
        }
        
    }
}

elements.searchForm.addEventListener('submit', e => {
    e.preventDefault();
    controlSearch();
});

elements.searchResultPages.addEventListener('click', e => {
    const btn = e.target.closest('.btn-inline');
    if (btn) {
        const goTopage = parseInt(btn.dataset.goto, 10);
        searchView.clearResults();
        searchView.renderResults(state.search.result, goTopage);
    }
});

// RECIPE CONTROLLER

const controlRecipe = async () => {
    // Get ID from url
    const id = window.location.hash.replace('#','');
    console.log(id);

    if (id) {
        // Prepare UI for changes
        renderLoader(elements.recipe);

        // Highlighted selected search item
        if (state.search) {
            searchView.highlightSelected(id);
        }    

        // Create new recipe object
        state.recipe = new Recipe(id);
        
        try {
            // Get recipe data and parse ingredients
            await state.recipe.getRecipe();
            // console.log(state.recipe.ingredients);
            state.recipe.parseIngredients();

            // Calculate servings and time
            state.recipe.calcTime();
            state.recipe.calcServings();

            // Render recipe
            recipeView.clearRecipe();
            clearLoader();
            recipeView.renderRecipe(
                state.recipe,
                state.likes.isLiked(id)
            )
            
        } catch(error) {
            // alert('Error processing recipe!');
            alert(error);
        }   
    }
}



['hashchange', 'load'].forEach(event => window.addEventListener(event, controlRecipe));


//////////////////////////////////////
//  LIST CONTROLLER
//////////////////////////////////////
const controlList = () => {
    // Create a new list if there in none yet
    if (!state.list) state.list = new List();

    // Add each ingredient to the list
    state.recipe.ingredients.forEach(el => {
        const item = state.list.addItem(el.count, el.unit, el.ingredient);
        listView.renderItem(item);
        // console.log(state.list.itemsLength());
        listView.deleteBtn(state.list.itemsLength());
    });
}

// Handle delete and update list item events
elements.shopping.addEventListener('click', e => {
    const id = e.target.closest('.shopping__item').dataset.itemid;

    // Handle the delete button
    if (e.target.matches('.shopping__delete, .shopping__delete *')) {
        // Delete from state
        state.list.deleteItem(id);

        // Delete from UI
        listView.deleteItem(id);

        // Shopping list delete button
        // console.log(state.list.itemsLength());
        listView.deleteBtn(state.list.itemsLength());

    // Handle count update    
    } else if (e.target.matches('.shopping__count--value')) {
        const val = parseFloat(e.target.value, 10);
        state.list.updateCount(id, val);
    }
});

elements.deleteList.addEventListener('click', e => {
    state.list.deleteShoppingList();
    listView.deleteShoppingList();
    console.log(state.list.itemsLength());
    listView.deleteBtn(state.list.itemsLength());
});



//////////////////////////////////////
//  LIKES CONTROLLER
//////////////////////////////////////



const controlLike = () => {
    if(!state.likes) state.likes = new Likes();
    const currentID = state.recipe.id;
    
    // User has NOT yet liked current recipe
    if (!state.likes.isLiked(currentID)) {
        // Add like to the state
        const newLike = state.likes.addLike(
            currentID,
            state.recipe.title,
            state.recipe.author,
            state.recipe.img
        );

        // Toggle the like button
        likesView.toggleLikeBtn(true);

        // Add like to the UI list
        likesView.renderLike(newLike);

        
        // User has liked current recipe 
    } else {
        // Remove like from the state
        state.likes.deleteLike(currentID);

        // Toggle the like button
        likesView.toggleLikeBtn(false);

        // Remove like from UI list
        likesView.deleteLike(currentID);

    }
    likesView.toggleLikeMenu(state.likes.getNumLikes());
}

// Restore liked recipes button clicks
window.addEventListener('load', () => {

    state.likes = new Likes();

    // Restore likes
    state.likes.readStorage();

    // Toggle like menu button
    likesView.toggleLikeMenu(state.likes.getNumLikes());

    // Render the existing likes
    state.likes.likes.forEach(like => likesView.renderLike(like));
})


// Handling recipe button clicks
elements.recipe.addEventListener('click', e => {
    if (e.target.matches('.btn-decrease, .btn-decrease *')) {
        // Decrease button is clicked
        if (state.recipe.servings > 1) {
            state.recipe.updateServings('dec');
            recipeView.updateServingsIngrdients(state.recipe);
        }
        console.log(state.recipe);
    } else if (e.target.matches('.btn-increase, .btn-increase *')) {
        // increase button is clicked
        state.recipe.updateServings('inc');
        recipeView.updateServingsIngrdients(state.recipe);
    } 
    else if (e.target.matches('.recipe__btn--add, .recipe__btn--add *')) {
        // Add ingredients to shopping list
        controlList();
    } else if (e.target.matches('.recipe__love, .recipe__love *')) {
        // Like controller
        controlLike();
    }
    
});