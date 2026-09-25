import React from "react";
import { useNavigate, Link } from "react-router-dom";
import "./Food.css";

import southIndian from "./southindian.webp";
import ComboFoods from "./food images/combo-food.png";
import nonVeg from "./nonveg.webp";
import fastFood from "./fastfood.jpg";
import vegFood from "./vegfood.jpg";
import desserts from "./desserts.jpg";
import drinksCategory from "./drinks.jpg";

// South Indian food images
import idly from "./food images/idly.jpg";
import dosa from "./food images/dosa.jpg";
import gheeRoast from "./food images/gheeroast.jpg";
import pongal from "./food images/pongal.webp";
import poori from "./food images/poori.webp";
import vada from "./food images/vada.jpg";
import fullMeals from "./food images/fullmeals.jpg";
import sambarRice from "./food images/sambarsatham.avif";
import curdRice from "./food images/curd rice.jpg";
import lemonRice from "./food images/lemon rice.jpg";

// Chinese food images
import vegFriedRice from "./food images/veg-fried-rice.webp";
import chickenFriedRice from "./food images/chicken-fried-rice.jpg";
import schezwanFriedRice from "./food images/schezwan-fried-rice.webp";
import vegNoodles from "./food images/veg-noodles.jpg";
import chickenNoodles from "./food images/chicken-noodles.jpg";
import gobiManchurian from "./food images/gobi-manchurian.webp";
import chickenManchurian from "./food images/chicken-manchurian.jpg";
import chilliPaneer from "./food images/chilli-panner.jpg";

// Drinks images
import badhamMilk from "./food images/badham-milk.jpg";
import roseMilk from "./food images/rose-milk.jpg";
import freshLime from "./food images/fresh-lime.png";
import mangoJuice from "./food images/mango-juice.webp";
import orangeJuice from "./food images/orange-juice.jpg";
import vanillaMilkshake from "./food images/vennila-milkshake.jpg";
import strawberryMilkshake from "./food images/strawberry-milkshake.jpg";
import chocolateMilkshake from "./food images/chocolate-milkshake.avif";
import lassi from "./food images/lassi.jpg";

// Dessert subcategory images
import cakesImg from "./food images/cakes.jpg";
import cookiesImg from "./food images/cookies.avif";
import piesImg from "./food images/pies.jpg";
import pastriesImg from "./food images/pasteries.webp";
import iceCreamCategoryImg from "./food images/icecream.jpg";

// Individual cake images
import chocolateTruffleImg from "./food images/chocolate-truffle.jpg";
import blackForestImg from "./food images/black-forest.jpg";
import whiteForestImg from "./food images/white-forest-cake.webp";
import redVelvetImg from "./food images/red-velvet-cake.jpg";
import spongeCakeImg from "./food images/sponge-cake.jpg";
import honeyCakeImg from "./food images/honey-cake.jpg";

// Pie images
import applePieImg from "./food images/apple-pie.jpg";
import chocolatePieImg from "./food images/chocolate pie.jpg";
import strawberryPieImg from "./food images/strawberry-pie.jpg";
import blueberryPieImg from "./food images/blueberry-pie.jpg";
import bananaCreamPieImg from "./food images/banana-cream-pie.jpg";
import lemonPieImg from "./food images/lemon-pie.jpg";

// Pastry images
import chocolatePastryImg from "./food images/chocolate-pastery.jpg";
import blackForestPastryImg from "./food images/black-forest-pastery.jpg";
import whiteForestPastryImg from "./food images/white-forest-pastery.jpg";
import redVelvetPastryImg from "./food images/red-velvet-pastery.jpg";
import strawberryPastryImg from "./food images/starwberry-pastery.avif";
import mangoPastryImg from "./food images/mango-pastery.jpg";

// Ice Cream flavor images
import belgiumChocolateIceCreamImg from "./food images/belgium-chocolate-icecream.jpg";
import blackCurrantIceCreamImg from "./food images/black-curranicecream.jpg";
import blueberryIceCreamImg from "./food images/blueberry-icecream.jpg";
import butterscotchIceCreamImg from "./food images/butter-scotch-icecream.jpg";
import chocolateBrownieIceCreamImg from "./food images/chocolate-brownie-icecream.jpg";
import chocolateIceCreamImg from "./food images/chocolate-ice cream.jpg";
import coffeeIceCreamImg from "./food images/coffee-icecream.jpg";
import oreoIceCreamImg from "./food images/oreo-icecream.jpg";
import pineappleIceCreamImg from "./food images/pineapple-icecream.jpg";
import pistaIceCreamImg from "./food images/pista-ice cream.jpg";
import raspberryIceCreamImg from "./food images/raspberry-icecream.jpg";
import redVelvetIceCreamImg from "./food images/red-velvet-icecream.jpg";
import strawberryIceCreamImg from "./food images/strawberry-icecream.jpg";
import tenderCoconutIceCreamImg from "./food images/tender-coconut-icecream.jpg";
import vanillaIceCreamImg from "./food images/vennila-icecream.jpg";

// Veg Specials images
import paneerButterMasalaImg from "./food images/panner-butter-masala.jpg";
import paneerTikkaImg from "./food images/panner-tikka.webp";
import mushroomMasalaImg from "./food images/mushroom-masala.jpg";
import mushroomPepperFryImg from "./food images/mushroom-pepper-fry.jpg";
import babyCornManchurianImg from "./food images/baby-corn-manchurian.jpg";
import vegManchurianImg from "./food images/veg-manchurian.jpg";
import vegKurmaImg from "./food images/veg-kuruma.jpg";
import chilliPaneerVegImg from "./food images/chilli-panner.webp";
import vegFriedRiceVegImg from "./food images/veg-fried-rice.jpg";
import vegNoodlesVegImg from "./food images/veg-noodles.jpg";
import vegBiryaniImg from "./food images/veg-biryani.jpg";

// Non-Veg subcategory images
import chickenCategoryImg from "./food images/chicken.jpg";
import muttonCategoryImg from "./food images/mutton.jpg";
import fishCategoryImg from "./food images/fish.jpg";
import eggCategoryImg from "./food images/egg.jpg";
import prawnsCategoryImg from "./food images/prawns.avif";
import crabCategoryImg from "./food images/crab.jpg";

// Chicken dish images
import chickenBiryaniNonVegImg from "./food images/chicken-biriyani.jpg";
import chicken65Img from "./food images/chicken-65.jpg";
import chickenTikkaMasalaImg from "./food images/chicken-tikka.jpg";
import chickenPepperMasalaImg from "./food images/Pepper-chicken.jpg";

// Fish Curries & Rice images
import fishChettinadImg from "./food images/chetinadu-fish-curry.jpg";
import fishCoconutCurryImg from "./food images/Coconut-Fish-Curry-.jpg";
import fishButterMasalaImg from "./food images/fish-butter-masala.jpg";
import fishStewImg from "./food images/fish-stew.jpg";
import fishBiryaniImg from "./food images/fish-biryani.jpg";
import fishPulaoImg from "./food images/fish-pulao.jpg";
import fishDoPyazaImg from "./food images/fish-do-pyaza.jpg";

// Fish Fry images
import vanjaramFishFryImg from "./food images/vanjaram-fish-fry.jpg";
import pomfretFishFryImg from "./food images/pomfret-fish-fry.jpg";
import sankaraFishFryImg from "./food images/sankara-fish-fry.jpg";
import ayalaFishFryImg from "./food images/ayala(mackerel ) fish fry.jpg";
import nethiliFishFryImg from "./food images/ayala(mackerel ) fish fry.jpg"; // temporary, no dedicated nethili image yet
import paraiFishFryImg from "./food images/parai-fish-fry.jpg";

// Mutton dish images
import muttonChukkaImg from "./food images/mutton chuka.jpg";
import muttonPepperFryImg from "./food images/mutton-pepper-fry.jpg";
import muttonVaruvalImg from "./food images/muuton-varuval.jpg";
import muttonKolaUrundaiImg from "./food images/mutton-kola-urundai.jpg";
import muttonSheekhKebabImg from "./food images/mutton-sheek-kebab.jpg";
import muttonCurryImg from "./food images/mutton-curry.jpg";
import muttonChettinadImg from "./food images/mutton-chetinadu.avif";
import muttonKormaImg from "./food images/mutton-korma.avif";
import muttonLiverFryImg from "./food images/mutton-liver.jpg";
import muttonBiryaniImg from "./food images/mutton-biriyani.jpg";
import amburMuttonBiryaniImg from "./food images/ambur-mutton-biriyani.jpg";
import muttonChopsImg from "./food images/mutton-chops.jpg";
import nalliElumbuMasalaImg from "./food images/nalli-elumbu-masala.jpg";
import muttonBoneSoupImg from "./food images/mutton-soup.jpg";
import muttonKeemaImg from "./food images/mutton-keema.jpg";

// Egg dish images
import egg65Img from "./food images/egg-65.jpg";
import chilliEggImg from "./food images/chilly-egg.jpg";
import eggPakodaImg from "./food images/egg-pakoda.jpg";
import eggCurryImg from "./food images/egg-curry.jpg";
import eggMasalaImg from "./food images/egg-masala.jpg";
import eggChettinadImg from "./food images/egg-chettinad.jpg";
import eggBiryaniImg from "./food images/egg-biryani.jpg";
import eggFriedRiceImg from "./food images/egg-fried rice.jpg";
import eggNoodlesImg from "./food images/egg-noodles.jpg";
import masalaOmeletteImg from "./food images/Masala-Omelette.webp";
import cheeseOmeletteImg from "./food images/cheese-ombellte.jpg";
import kalakkiImg from "./food images/kalakki.jpg";
import eggPodimasImg from "./food images/egg-podimas.jpg";
import eggRoastImg from "./food images/egg-roast.jpg";

// Prawns dish images
import prawnChettinadImg from "./food images/prawn-chetinad.webp";
import prawnPepperFryImg from "./food images/prawn-pepper.jpg";
import prawn65Img from "./food images/prawn-65.jpg";
import butterGarlicPrawnsImg from "./food images/butter-garlic-prawns.jpg";
import prawnsCoconutCurryImg from "./food images/prawns-coconut curry.jpg";
import prawnsNoodlesImg from "./food images/prawns-noodles.jpg";
import prawnBiryaniImg from "./food images/prawn-biryani.jpg";
import crispyFriedPrawnsImg from "./food images/crispy-fried-prawns.jpg";
import prawnsCheeseBallsImg from "./food images/prawns-cheese-balls.jpg";
import prawnsTacosImg from "./food images/prawns-tacos.jpg";
import prawnsPizzaImg from "./food images/prawns-pizza.jpg";
import prawnsTempuraImg from "./food images/PRAWNS-TEMPURA.jpg";
import prawnsMomosImg from "./food images/prawns-momos.avif";
import prawnsSpringRollImg from "./food images/prawns-spring-roll.jpg";
import sweetSourPrawnsImg from "./food images/sweet and sour prawns.jpg";

// Crab dish images
import crabFriedRiceImg from "./food images/crab-fried rice.jpg";
import crabBiryaniImg from "./food images/crab-biryani.webp";
import crabThokkuImg from "./food images/crab-thokku.webp";
import chettinadCrabImg from "./food images/chetinad crab.jpg";
import crabVaruvalImg from "./food images/crab-varuval.jpg";
import crabCurryImg from "./food images/Crab-Curry.jpg";
import crabManchurianImg from "./food images/crab-manchurian.jpg";
import crab65Img from "./food images/crab-65.jpg";
import crabMasalaImg from "./food images/crab-masala.jpg";
import crabSoupImg from "./food images/crab-soup.jpg";
import grilledCrabLegsImg from "./food images/grilled-crab-legs.jpg";
import crispFriedCrabImg from "./food images/crisp-fried-crab.jpg";
import pepperCrabImg from "./food images/pepper-crab.jpg";
import chilliCrabImg from "./food images/chilli-crab.jpg";
import coconutCurryCrabImg from "./food images/coconut-curry-crab.jpg";

// Fast Food images
import vegPizzaImg from "./food images/veg-pizza.jpg";
import chickenPizzaImg from "./food images/chicken-pizza.jpg";
import vegBurgerImg from "./food images/veg-burger.webp";
import chickenBurgerImg from "./food images/chicken-burger.jpg";
import chickenShawarmaImg from "./food images/chicken-shawarma.jpg";
import chickenRollImg from "./food images/chicken-roll.jpg"; // temporary, same as shawarma
import vegSandwichImg from "./food images/veg-sandwich.webp";
import chickenSandwichImg from "./food images/chicken-sandwich.jpg";
import frenchFriesImg from "./food images/french-images.jpg";
import cheeseFriesImg from "./food images/cheese-fries.jpg";
import whiteSaucePastaImg from "./food images/White-Sauce-Pasta.webp";
import redSaucePastaImg from "./food images/red-chauce-pasta.jpg";
import cheeseGarlicBreadImg from "./food images/Cheesy-Garlic-Bread.webp";
import vegMomosImg from "./food images/momos-recipe.jpg";
import chickenMomosImg from "./food images/chilli-chicken-momos.jpg";

function Food() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = React.useState(null);
  const [selectedSubCategory, setSelectedSubCategory] = React.useState(null);
  const [cart, setCart] = React.useState([]);
  const [selectedSizes, setSelectedSizes] = React.useState({});
  const [selectedFishGroup, setSelectedFishGroup] = React.useState(null);

  const handleOrderNow = () => {
    if (cart.length === 0) {
      alert("YOUR CART IS EMPTY. PLEASE ADD FOOD ITEMS FIRST! 🍽️");
      return;
    }
    navigate("/food-checkout", { state: { cart } });
  };

  const cartButton = cart.length > 0 && (
    <button
      type="button"
      className="btn btn-warning fw-bold"
      style={{
        position: "fixed",
        bottom: "20px",
        right: "20px",
        zIndex: 1000,
        borderRadius: "50px",
        padding: "12px 24px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
      }}
      onClick={handleOrderNow}
    >
      🛒 Cart ({cart.length}) — Order Now
    </button>
  );

  const categories = [
    { name: "South Indian", image: southIndian },
    { name: "Combo Foods", image: ComboFoods },
    { name: "Non-Veg Specials", image: nonVeg },
    { name: "Fast Food", image: fastFood },
    { name: "Veg Specials", image: vegFood },
    { name: "Desserts", image: desserts },
    { name: "Drinks", image: drinksCategory },
  ];

  const dessertSubCategories = [
    { name: "Cakes", image: cakesImg },
    { name: "Cookies", image: cookiesImg },
    { name: "Pies", image: piesImg },
    { name: "Pastries", image: pastriesImg },
    { name: "Ice Cream", image: iceCreamCategoryImg },
  ];

  const nonVegSubCategories = [
    { name: "Chicken", image: chickenCategoryImg },
    { name: "Mutton", image: muttonCategoryImg },
    { name: "Fish", image: fishCategoryImg },
    { name: "Egg", image: eggCategoryImg },
    { name: "Prawns", image: prawnsCategoryImg },
    { name: "Crab", image: crabCategoryImg },
  ];

  // Fish Fries is accessed via a special card on the Fish page (no separate group-choice page needed)

  // Categories that use a 2-level (subcategory) structure
  const subCategoryParents = {
    "Desserts": dessertSubCategories,
    "Non-Veg Specials": nonVegSubCategories,
  };

  const foodMenu = {
    "South Indian": [
      { id: 1, name: "Idly", price: 40, image: idly },
      { id: 2, name: "Dosa", price: 60, image: dosa },
      { id: 3, name: "Ghee Roast", price: 100, image: gheeRoast },
      { id: 4, name: "Pongal", price: 70, image: pongal },
      { id: 5, name: "Poori", price: 60, image: poori },
      { id: 6, name: "Vada", price: 25, image: vada },
      { id: 7, name: "Full Meals", price: 300, image: fullMeals },
      { id: 8, name: "Sambar Rice", price: 150, image: sambarRice },
      { id: 9, name: "Curd Rice", price: 150, image: curdRice },
      { id: 10, name: "Lemon Rice", price: 150, image: lemonRice },
    ],
    "Combo Foods": [
      {
        id: 1001,
        name: "Chicken Biryani Deluxe Combo",
        price: 430,
        items: ["Chicken Biryani", "Chicken 65", "Raita", "Ice Cream"],
      },
      {
        id: 1002,
        name: "Chicken Chinese Deluxe Combo",
        price: 410,
        items: ["Chicken Fried Rice", "Chicken Manchurian", "Fresh Lime", "Ice Cream"],
      },
      {
        id: 1003,
        name: "Mutton Biryani Deluxe Combo",
        price: 730,
        items: ["Mutton Biryani", "Mutton Chukka", "Raita", "Ice Cream"],
      },
      {
        id: 1004,
        name: "Mutton Parotta Deluxe Combo",
        price: 350,
        items: ["Parotta (2)", "Mutton Curry", "Salna", "Ice Cream"],
      },
      {
        id: 1005,
        name: "Crab Fried Rice Deluxe Combo",
        price: 500,
        items: ["Crab Fried Rice", "Crab Pepper Fry", "Drink", "Ice Cream"],
      },
      {
        id: 1006,
        name: "Crab Biryani Deluxe Combo",
        price: 550,
        items: ["Crab Biryani", "Chettinad Crab", "Raita", "Ice Cream"],
      },
      {
        id: 1007,
        name: "Prawns Special Rice Combo",
        price: 450,
        items: ["Prawns Fried Rice", "Prawns 65", "Drink"],
      },
      {
        id: 1008,
        name: "Prawns Biryani Combo",
        price: 500,
        items: ["Prawns Biryani", "Prawns Pepper Fry", "Raita"],
      },
      {
        id: 1009,
        name: "Egg Chinese Combo",
        price: 280,
        items: ["Egg Fried Rice", "Chilli Egg", "Fresh Lime"],
      },
      {
        id: 1010,
        name: "Egg Biryani Combo",
        price: 300,
        items: ["Egg Biryani", "Egg 65", "Raita"],
      },
      {
        id: 1011,
        name: "Chicken Burger Combo",
        price: 300,
        items: ["Chicken Burger", "French Fries", "Fresh Lime / Cool Drink"],
      },
      {
        id: 1012,
        name: "Chicken Pizza Combo",
        price: 400,
        items: ["Chicken Pizza (8 inch)", "Cheese Garlic Bread", "Cool Drink"],
      },
      {
        id: 1013,
        name: "South Indian Combo",
        price: 200,
        items: ["2 Idli", "Masala Dosa", "Pongal", "Vada", "Sambar", "2 Chutneys"],
      },
    ],
    "Drinks": [
      { id: 19, name: "Badham Milk", price: 100, image: badhamMilk },
      { id: 20, name: "Rose Milk", price: 100, image: roseMilk },
      { id: 21, name: "Fresh Lime", price: 70, image: freshLime },
      { id: 22, name: "Mango Juice", price: 100, image: mangoJuice },
      { id: 23, name: "Orange Juice", price: 100, image: orangeJuice },
      { id: 24, name: "Vanilla Milkshake", price: 170, image: vanillaMilkshake },
      { id: 25, name: "Strawberry Milkshake", price: 170, image: strawberryMilkshake },
      { id: 26, name: "Chocolate Milkshake", price: 100, image: chocolateMilkshake },
      { id: 27, name: "Lassi", price: 100, image: lassi },
    ],
    "Cakes": [
      {
        id: 101,
        name: "Chocolate Truffle",
        image: chocolateTruffleImg,
        options: [
          { label: "1 Piece", price: 100 },
          { label: "500g", price: 550 },
          { label: "1 Kg", price: 1050 },
        ],
      },
      {
        id: 102,
        name: "Black Forest",
        image: blackForestImg,
        options: [
          { label: "1 Piece", price: 80 },
          { label: "500g", price: 500 },
          { label: "1 Kg", price: 950 },
        ],
      },
      {
        id: 103,
        name: "White Forest",
        image: whiteForestImg,
        options: [
          { label: "1 Piece", price: 80 },
          { label: "500g", price: 500 },
          { label: "1 Kg", price: 950 },
        ],
      },
      {
        id: 104,
        name: "Red Velvet",
        image: redVelvetImg,
        options: [
          { label: "1 Piece", price: 100 },
          { label: "500g", price: 600 },
          { label: "1 Kg", price: 1150 },
        ],
      },
      {
        id: 105,
        name: "Sponge Cake",
        image: spongeCakeImg,
        options: [
          { label: "1 Piece", price: 60 },
          { label: "500g", price: 400 },
          { label: "1 Kg", price: 750 },
        ],
      },
      {
        id: 106,
        name: "Honey Cake",
        image: honeyCakeImg,
        options: [
          { label: "1 Piece", price: 70 },
          { label: "500g", price: 450 },
          { label: "1 Kg", price: 850 },
        ],
      },
    ],
    "Cookies": [],
    "Pies": [
      {
        id: 151,
        name: "Apple Pie",
        image: applePieImg,
        options: [
          { label: "1 Slice", price: 100 },
          { label: "3 Slices", price: 250 },
          { label: "Whole Pie", price: 550 },
        ],
      },
      {
        id: 152,
        name: "Chocolate Pie",
        image: chocolatePieImg,
        options: [
          { label: "1 Slice", price: 100 },
          { label: "3 Slices", price: 280 },
          { label: "Whole Pie", price: 600 },
        ],
      },
      {
        id: 153,
        name: "Strawberry Pie",
        image: strawberryPieImg,
        options: [
          { label: "1 Slice", price: 100 },
          { label: "3 Slices", price: 250 },
          { label: "Whole Pie", price: 550 },
        ],
      },
      {
        id: 154,
        name: "Blueberry Pie",
        image: blueberryPieImg,
        options: [
          { label: "1 Slice", price: 120 },
          { label: "3 Slices", price: 280 },
          { label: "Whole Pie", price: 600 },
        ],
      },
      {
        id: 155,
        name: "Banana Cream Pie",
        image: bananaCreamPieImg,
        options: [
          { label: "1 Slice", price: 100 },
          { label: "3 Slices", price: 250 },
          { label: "Whole Pie", price: 550 },
        ],
      },
      {
        id: 156,
        name: "Lemon Pie",
        image: lemonPieImg,
        options: [
          { label: "1 Slice", price: 150 },
          { label: "3 Slices", price: 220 },
          { label: "Whole Pie", price: 500 },
        ],
      },
    ],
    "Pastries": [
      { id: 161, name: "Chocolate Pastry", price: 70, image: chocolatePastryImg },
      { id: 162, name: "Black Forest Pastry", price: 80, image: blackForestPastryImg },
      { id: 163, name: "White Forest Pastry", price: 80, image: whiteForestPastryImg },
      { id: 164, name: "Red Velvet Pastry", price: 90, image: redVelvetPastryImg },
      { id: 165, name: "Strawberry Pastry", price: 80, image: strawberryPastryImg },
      { id: 166, name: "Mango Pastry", price: 70, image: mangoPastryImg },
    ],
    "Ice Cream": [
      { id: 171, name: "Belgium Chocolate Ice Cream", price: 120, image: belgiumChocolateIceCreamImg },
      { id: 172, name: "Black Currant Ice Cream", price: 90, image: blackCurrantIceCreamImg },
      { id: 173, name: "Blueberry Ice Cream", price: 90, image: blueberryIceCreamImg },
      { id: 174, name: "Butterscotch Ice Cream", price: 90, image: butterscotchIceCreamImg },
      { id: 175, name: "Chocolate Brownie Ice Cream", price: 170, image: chocolateBrownieIceCreamImg },
      { id: 176, name: "Chocolate Ice Cream", price: 80, image: chocolateIceCreamImg },
      { id: 177, name: "Coffee Ice Cream", price: 90, image: coffeeIceCreamImg },
      { id: 178, name: "Oreo Ice Cream", price: 100, image: oreoIceCreamImg },
      { id: 179, name: "Pineapple Ice Cream", price: 85, image: pineappleIceCreamImg },
      { id: 180, name: "Pista Ice Cream", price: 95, image: pistaIceCreamImg },
      { id: 181, name: "Raspberry Ice Cream", price: 90, image: raspberryIceCreamImg },
      { id: 182, name: "Red Velvet Ice Cream", price: 100, image: redVelvetIceCreamImg },
      { id: 183, name: "Strawberry Ice Cream", price: 85, image: strawberryIceCreamImg },
      { id: 184, name: "Tender Coconut Ice Cream", price: 120, image: tenderCoconutIceCreamImg },
      { id: 185, name: "Vanilla Ice Cream", price: 70, image: vanillaIceCreamImg },
    ],

    // Non-Veg subcategories
    "Chicken": [
      { id: 701, name: "Chicken Biryani", price: 220, image: chickenBiryaniNonVegImg },
      { id: 702, name: "Chicken 65", price: 200, image: chicken65Img },
      { id: 703, name: "Chicken Tikka Masala", price: 260, image: chickenTikkaMasalaImg },
      { id: 704, name: "Chicken Pepper Masala", price: 230, image: chickenPepperMasalaImg },
      { id: 705, name: "Chicken Manchurian", price: 230, image: chickenManchurian },
      { id: 706, name: "Chicken Fried Rice", price: 180, image: chickenFriedRice },
      { id: 707, name: "Chicken Noodles", price: 180, image: chickenNoodles },
    ],
    "Mutton": [
      { id: 201, name: "Mutton Chukka", price: 350, image: muttonChukkaImg },
      { id: 202, name: "Mutton Pepper Fry", price: 380, image: muttonPepperFryImg },
      { id: 203, name: "Mutton Varuval", price: 350, image: muttonVaruvalImg },
      { id: 204, name: "Mutton Kola Urundai", price: 300, image: muttonKolaUrundaiImg },
      { id: 205, name: "Mutton Sheekh Kebab", price: 400, image: muttonSheekhKebabImg },
      { id: 206, name: "Mutton Curry", price: 350, image: muttonCurryImg },
      { id: 207, name: "Mutton Chettinad", price: 380, image: muttonChettinadImg },
      { id: 208, name: "Mutton Korma", price: 380, image: muttonKormaImg },
      { id: 209, name: "Mutton Liver Fry", price: 300, image: muttonLiverFryImg },
      { id: 210, name: "Mutton Biryani", price: 2, image: muttonBiryaniImg },
      { id: 212, name: "Ambur Mutton Biryani", price: 400, image: amburMuttonBiryaniImg },
      { id: 213, name: "Mutton Chops", price: 400, image: muttonChopsImg },
      { id: 214, name: "Nalli Elumbu Masala", price: 500, image: nalliElumbuMasalaImg },
      { id: 215, name: "Mutton Bone Soup", price: 150, image: muttonBoneSoupImg },
      { id: 216, name: "Mutton Keema", price: 380, image: muttonKeemaImg },
    ],
    "Fish": [
      { id: 601, name: "Fish Chettinad", price: 230, image: fishChettinadImg },
      { id: 602, name: "Fish Coconut Curry", price: 220, image: fishCoconutCurryImg },
      { id: 603, name: "Fish Butter Masala", price: 240, image: fishButterMasalaImg },
      { id: 604, name: "Fish Stew", price: 200, image: fishStewImg },
      { id: 605, name: "Fish Biryani", price: 280, image: fishBiryaniImg },
      { id: 606, name: "Fish Pulao", price: 250, image: fishPulaoImg },
      { id: 607, name: "Fish Do Pyaza", price: 230, image: fishDoPyazaImg },
    ],
    "Fish Fries": [
      { id: 611, name: "Vanjaram Fish Fry", price: 280, image: vanjaramFishFryImg },
      { id: 612, name: "Pomfret Fish Fry", price: 270, image: pomfretFishFryImg },
      { id: 613, name: "Sankara Fish Fry", price: 260, image: sankaraFishFryImg },
      { id: 614, name: "Ayala (Mackerel) Fish Fry", price: 220, image: ayalaFishFryImg },
      { id: 615, name: "Nethili (Anchovy) Fish Fry", price: 180, image: nethiliFishFryImg },
      { id: 616, name: "Parai Fish Fry", price: 240, image: paraiFishFryImg },
    ],
    "Egg": [
      { id: 301, name: "Egg 65", price: 120, image: egg65Img },
      { id: 302, name: "Chilli Egg", price: 140, image: chilliEggImg },
      { id: 303, name: "Egg Pakoda", price: 120, image: eggPakodaImg },
      { id: 304, name: "Egg Curry", price: 150, image: eggCurryImg },
      { id: 305, name: "Egg Masala", price: 160, image: eggMasalaImg },
      { id: 306, name: "Egg Chettinad", price: 180, image: eggChettinadImg },
      { id: 307, name: "Egg Biryani", price: 180, image: eggBiryaniImg },
      { id: 308, name: "Egg Fried Rice", price: 160, image: eggFriedRiceImg },
      { id: 309, name: "Egg Noodles", price: 160, image: eggNoodlesImg },
      { id: 310, name: "Masala Omelette", price: 80, image: masalaOmeletteImg },
      { id: 311, name: "Cheese Omelette", price: 120, image: cheeseOmeletteImg },
      { id: 312, name: "Kalakki", price: 60, image: kalakkiImg },
      { id: 313, name: "Egg Podimas", price: 90, image: eggPodimasImg },
      { id: 314, name: "Egg Roast", price: 150, image: eggRoastImg },
    ],
    "Prawns": [
      { id: 901, name: "Prawns Chettinad", price: 280, image: prawnChettinadImg },
      { id: 902, name: "Prawns Pepper Fry", price: 290, image: prawnPepperFryImg },
      { id: 903, name: "Prawns 65", price: 260, image: prawn65Img },
      { id: 904, name: "Butter Garlic Prawns", price: 320, image: butterGarlicPrawnsImg },
      { id: 905, name: "Prawns Coconut Curry", price: 280, image: prawnsCoconutCurryImg },
      { id: 906, name: "Prawns Noodles", price: 240, image: prawnsNoodlesImg },
      { id: 907, name: "Prawn Biryani", price: 320, image: prawnBiryaniImg },
      { id: 908, name: "Crispy Fried Prawns", price: 290, image: crispyFriedPrawnsImg },
      { id: 909, name: "Prawns Cheese Balls", price: 220, image: prawnsCheeseBallsImg },
      { id: 910, name: "Prawns Tacos", price: 250, image: prawnsTacosImg },
      { id: 911, name: "Prawns Pizza", price: 300, image: prawnsPizzaImg },
      { id: 912, name: "Prawns Tempura", price: 300, image: prawnsTempuraImg },
      { id: 913, name: "Prawns Momos", price: 220, image: prawnsMomosImg },
      { id: 914, name: "Prawns Spring Roll", price: 230, image: prawnsSpringRollImg },
      { id: 915, name: "Sweet and Sour Prawns", price: 250, image: sweetSourPrawnsImg },
    ],
    "Crab": [
      { id: 801, name: "Crab Fried Rice", price: 300, image: crabFriedRiceImg },
      { id: 802, name: "Crab Biryani", price: 360, image: crabBiryaniImg },
      { id: 803, name: "Crab Thokku", price: 330, image: crabThokkuImg },
      { id: 804, name: "Chettinad Crab", price: 360, image: chettinadCrabImg },
      { id: 805, name: "Crab Varuval", price: 330, image: crabVaruvalImg },
      { id: 806, name: "Crab Curry", price: 310, image: crabCurryImg },
      { id: 807, name: "Crab Manchurian", price: 340, image: crabManchurianImg },
      { id: 808, name: "Crab 65", price: 330, image: crab65Img },
      { id: 809, name: "Crab Masala", price: 340, image: crabMasalaImg },
      { id: 810, name: "Crab Soup", price: 200, image: crabSoupImg },
      { id: 811, name: "Grilled Crab Legs", price: 430, image: grilledCrabLegsImg },
      { id: 812, name: "Crisp Fried Crab", price: 360, image: crispFriedCrabImg },
      { id: 813, name: "Pepper Crab", price: 330, image: pepperCrabImg },
      { id: 814, name: "Chilli Crab", price: 340, image: chilliCrabImg },
      { id: 815, name: "Coconut Curry Crab", price: 330, image: coconutCurryCrabImg },
    ],

    "Fast Food": [
      { id: 401, name: "Veg Pizza (8 inch)", price: 200, image: vegPizzaImg },
      { id: 402, name: "Chicken Pizza (8 inch)", price: 300, image: chickenPizzaImg },
      { id: 403, name: "Veg Burger", price: 90, image: vegBurgerImg },
      { id: 404, name: "Chicken Burger", price: 120, image: chickenBurgerImg },
      { id: 405, name: "Chicken Shawarma", price: 150, image: chickenShawarmaImg },
      { id: 406, name: "Chicken Roll", price: 110, image: chickenRollImg },
      { id: 407, name: "Veg Sandwich (2 halves)", price: 80, image: vegSandwichImg },
      { id: 408, name: "Chicken Sandwich (2 halves)", price: 110, image: chickenSandwichImg },
      { id: 409, name: "French Fries", price: 70, image: frenchFriesImg },
      { id: 410, name: "Cheese Fries", price: 100, image: cheeseFriesImg },
      { id: 411, name: "White Sauce Pasta", price: 140, image: whiteSaucePastaImg },
      { id: 412, name: "Red Sauce Pasta", price: 130, image: redSaucePastaImg },
      { id: 413, name: "Cheese Garlic Bread (4 pcs)", price: 120, image: cheeseGarlicBreadImg },
      { id: 414, name: "Veg Momos (6 pcs)", price: 100, image: vegMomosImg },
      { id: 415, name: "Chicken Momos (6 pcs)", price: 150, image: chickenMomosImg },
    ],

    "Veg Specials": [
      { id: 501, name: "Paneer Butter Masala", price: 180, image: paneerButterMasalaImg },
      { id: 503, name: "Paneer Tikka", price: 190, image: paneerTikkaImg },
      { id: 504, name: "Mushroom Masala", price: 160, image: mushroomMasalaImg },
      { id: 505, name: "Mushroom Pepper Fry", price: 170, image: mushroomPepperFryImg },
      { id: 506, name: "Gobi Manchurian", price: 120, image: gobiManchurian },
      { id: 507, name: "Baby Corn Manchurian", price: 140, image: babyCornManchurianImg },
      { id: 508, name: "Veg Manchurian", price: 130, image: vegManchurianImg },
      { id: 509, name: "Veg Kurma", price: 130, image: vegKurmaImg },
      { id: 511, name: "Chilli Paneer", price: 180, image: chilliPaneerVegImg },
      { id: 512, name: "Veg Fried Rice", price: 130, image: vegFriedRiceVegImg },
      { id: 513, name: "Veg Noodles", price: 130, image: vegNoodlesVegImg },
      { id: 514, name: "Veg Biryani", price: 150, image: vegBiryaniImg },
    ],
  };

  const handleAddToCart = (item, sizeLabel, price) => {
    setCart([...cart, { ...item, selectedSize: sizeLabel, finalPrice: price }]);
    alert(`${item.name} ${sizeLabel ? `(${sizeLabel}) ` : ""}**Added to cart successfully!**
🛒`);
  };

  const handleSizeChange = (itemId, optionIndex) => {
    setSelectedSizes({ ...selectedSizes, [itemId]: optionIndex });
  };

  // Level 3: Subcategory items page (works for Desserts AND Non-Veg Specials)
  if (subCategoryParents[selectedCategory] && selectedSubCategory !== null) {
    // Fish Fries sub-view: shown only when the Fish Fries card is clicked
    if (selectedSubCategory === "Fish" && selectedFishGroup === "Fish Fries") {
      const fryItems = foodMenu["Fish Fries"] || [];

      return (
        <div className="food-page-wrapper" style={{ paddingTop: "120px" }}>
          <div className="container">
            <h1 className="text-center mb-5">🍽️ Fish Fries</h1>

            <div className="row g-4">
              {fryItems.map((item) => (
                <div className="col-md-6 col-lg-4" key={item.id}>
                  <div className="card shadow h-100 text-center">
                    <div className="food-img-wrap">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="card-img-top"
                        style={{ height: "210px", objectFit: "cover" }}
                      />
                    </div>
                    <div className="card-body">
                      <h5 className="fw-bold">{item.name}</h5>
                      <p className="fs-5">₹{item.price}</p>
                      <button
                        className="btn btn-warning fw-bold"
                        onClick={() => handleAddToCart(item, "", item.price)}
                      >
                        Add to Cart
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center mt-5">
              <button
                className="btn btn-dark"
                onClick={() => setSelectedFishGroup(null)}
              >
                ← Back to Fish
              </button>
            </div>
          </div>

          {cartButton}
        </div>
      );
    }

    const items = foodMenu[selectedSubCategory] || [];

    return (
      <div className="food-page-wrapper" style={{ paddingTop: "120px" }}>
        <div className="container">
          <h1 className="text-center mb-5">🍽️ {selectedSubCategory}</h1>

          <div className="row g-4">
            {/* Fish Fries card appears first, only on the Fish page */}
            {selectedSubCategory === "Fish" && (
              <div className="col-md-6 col-lg-4">
                <div className="card shadow h-100">
                  <div className="food-img-wrap">
                    <img
                      src={vanjaramFishFryImg}
                      className="card-img-top"
                      alt="Fish Fries"
                      style={{ height: "210px", objectFit: "cover" }}
                    />
                  </div>
                  <div className="card-body text-center">
                    <h5 className="fw-bold">🍤 Fish Fries</h5>
                    <button
                      type="button"
                      className="btn btn-dark mt-2"
                      onClick={() => setSelectedFishGroup("Fish Fries")}
                    >
                      Explore Foods
                    </button>
                  </div>
                </div>
              </div>
            )}

            {items.map((item) => {
              const hasOptions = item.options && item.options.length > 0;
              const selectedIndex = selectedSizes[item.id] || 0;
              const currentPrice = hasOptions
                ? item.options[selectedIndex].price
                : item.price;
              const currentLabel = hasOptions
                ? item.options[selectedIndex].label
                : "";

              return (
                <div className="col-md-6 col-lg-4" key={item.id}>
                  <div className="card shadow h-100 text-center">
                    <div className="food-img-wrap">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="card-img-top"
                        style={{ height: "210px", objectFit: "cover" }}
                      />
                    </div>
                    <div className="card-body">
                      <h5 className="fw-bold">{item.name}</h5>

                      {hasOptions && (
                        <select
                          className="form-select mb-2"
                          value={selectedIndex}
                          onChange={(e) =>
                            handleSizeChange(item.id, Number(e.target.value))
                          }
                        >
                          {item.options.map((opt, index) => (
                            <option key={opt.label} value={index}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      )}

                      <p className="fs-5">₹{currentPrice}</p>

                      <button
                        className="btn btn-warning fw-bold"
                        onClick={() =>
                          handleAddToCart(item, currentLabel, currentPrice)
                        }
                      >
                        Add to Cart
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-center mt-5">
            <button
              className="btn btn-dark"
              onClick={() => setSelectedSubCategory(null)}
            >
              ← Back to {selectedCategory}
            </button>
          </div>
        </div>

        {cartButton}
      </div>
    );
  }

  // Level 2: Subcategory list page (works for Desserts AND Non-Veg Specials)
  if (subCategoryParents[selectedCategory]) {
    const subCategories = subCategoryParents[selectedCategory];

    return (
      <div className="food-page-wrapper" style={{ paddingTop: "120px" }}>
        <div className="container">
          <h1 className="text-center mb-5">🍽️ {selectedCategory}</h1>

          <div className="row g-4">
            {subCategories.map((sub) => (
              <div className="col-md-6 col-lg-4" key={sub.name}>
                <div className="card shadow h-100">
                  <div className="food-img-wrap">
                    <img
                      src={sub.image}
                      className="card-img-top"
                      alt={sub.name}
                      style={{ height: "250px", objectFit: "cover" }}
                    />
                  </div>
                  <div className="card-body text-center">
                    <h4 className="fw-bold">{sub.name}</h4>
                    <button
                      type="button"
                      className="btn btn-dark mt-2"
                      onClick={() => {
                        setSelectedSubCategory(sub.name);
                        setSelectedFishGroup(null);
                      }}
                    >
                      Explore Foods
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-5">
            <button
              className="btn btn-dark"
              onClick={() => {
                setSelectedCategory(null);
                setSelectedFishGroup(null);
              }}
            >
              ← Back to Food Menu
            </button>
          </div>
        </div>

        {cartButton}
      </div>
    );
  }

  // Level 2: Other categories item page (South Indian, Chinese, Drinks, etc.)
  if (selectedCategory !== null) {
    const items = foodMenu[selectedCategory] || [];

    return (
      <div className="food-page-wrapper" style={{ paddingTop: "120px" }}>
        <div className="container">
          <h1 className="text-center mb-5">🍛 {selectedCategory}</h1>

          <div className="row g-4">
            {items.map((item) => (
              <div className="col-md-6 col-lg-4" key={item.id}>
                <div className="card shadow h-100 text-center">
                  {item.image && (
                    <div className="food-img-wrap">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="card-img-top"
                        style={{ height: "210px", objectFit: "cover" }}
                      />
                    </div>
                  )}

                  <div className="card-body">
                    <h5 className="fw-bold">{item.name}</h5>

                    {item.items && (
                      <p className="text-muted small mb-2">
                        {item.items.join(" + ")}
                      </p>
                    )}

                    <p className="fs-5">₹{item.price}</p>

                    <button
                      className="btn btn-warning fw-bold"
                      onClick={() => handleAddToCart(item, "", item.price)}
                    >
                      Add to Cart
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-5">
            <button
              className="btn btn-dark"
              onClick={() => setSelectedCategory(null)}
            >
              ← Back to Food Menu
            </button>
          </div>
        </div>

        {cartButton}
      </div>
    );
  }

  // Level 1: Main category page
  return (
    <div className="food-page-wrapper" style={{ paddingTop: "10px" }}>
      <div className="container py-3">
        <h1 className="text-center fw-bold mb-4">🍽️ Our Food Menu</h1>

        <div className="row g-4">
          {categories.map((category) => (
            <div className="col-md-6 col-lg-4" key={category.name}>
              <div className="card shadow h-100">
                <div className="food-img-wrap">
                  <img
                    src={category.image}
                    className="card-img-top"
                    alt={category.name}
                    style={{ height: "250px", objectFit: "cover" }}
                  />
                </div>

                <div className="card-body text-center">
                  <h4 className="fw-bold">{category.name}</h4>

                  <button
                    type="button"
                    className="btn btn-dark mt-2"
                    onClick={() => setSelectedCategory(category.name)}
                  >
                    Explore Foods
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-5">
          <Link
            to="/"
            className="btn btn-dark"
            style={{ display: "inline-block" }}
          >
            ⬅ Back to Home
          </Link>
        </div>
      </div>

      {cartButton}
    </div>
  );
}

export default Food;