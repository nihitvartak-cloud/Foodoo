import { useState } from "react";
import type { FormEvent } from "react";
import { dietaryPreferences, goals, transformationModes } from "./types";
import type { RecipeTransformation, TransformationInput } from "./types";

const initialForm: TransformationInput = {
  dishName: "",
  recipe: "",
  transformationMode: "Healthy transformation",
  dietaryPreference: "No preference",
  primaryGoal: "",
  secondaryGoal: "",
  calorieTarget: null,
  proteinTarget: null,
  servings: 2,
};

function isRecipeTransformation(value: unknown): value is RecipeTransformation {
  if (typeof value !== "object" || value === null) return false;
  const data = value as Record<string, unknown>;
  const nutrition = data.nutrition;
  const calorieChange = data.calorieChange;
  const isTextList = (items: unknown) =>
    Array.isArray(items) && items.every((item) => typeof item === "string");

  return (
    typeof data.originalDish === "string" &&
    typeof data.transformedDish === "string" &&
    typeof data.summary === "string" &&
    Number.isInteger(data.servings) &&
    typeof data.recommendedServingSize === "string" &&
    typeof nutrition === "object" &&
    nutrition !== null &&
    typeof (nutrition as Record<string, unknown>).calories === "number" &&
    typeof (nutrition as Record<string, unknown>).proteinGrams === "number" &&
    typeof (nutrition as Record<string, unknown>).carbohydratesGrams === "number" &&
    typeof (nutrition as Record<string, unknown>).fatGrams === "number" &&
    typeof (nutrition as Record<string, unknown>).fiberGrams === "number" &&
    typeof calorieChange === "object" &&
    calorieChange !== null &&
    ["reduction", "increase", "similar", "unknown"].includes(
      String((calorieChange as Record<string, unknown>).direction),
    ) &&
    ((calorieChange as Record<string, unknown>).amount === null ||
      typeof (calorieChange as Record<string, unknown>).amount === "number") &&
    ((calorieChange as Record<string, unknown>).percentage === null ||
      typeof (calorieChange as Record<string, unknown>).percentage === "number") &&
    isTextList(data.changes) &&
    isTextList(data.ingredients) &&
    isTextList(data.instructions) &&
    typeof data.whyItWorks === "string" &&
    typeof data.estimateNote === "string"
  );
}

function App() {
  const [form, setForm] = useState(initialForm);
  const [result, setResult] = useState<RecipeTransformation | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  function updatePrimaryGoal(value: string) {
    const primaryGoal =
      value === "" ? "" : goals.find((goal) => goal.value === value)?.value;
    if (primaryGoal === undefined) return;
    setForm((current) => ({
      ...current,
      primaryGoal,
      secondaryGoal:
        primaryGoal === current.secondaryGoal ? "" : current.secondaryGoal,
    }));
  }

  function updateSecondaryGoal(value: string) {
    const secondaryGoal =
      value === "" ? "" : goals.find((goal) => goal.value === value)?.value;
    if (secondaryGoal === undefined || secondaryGoal === form.primaryGoal) return;
    setForm((current) => ({ ...current, secondaryGoal }));
  }

  function updateTransformationMode(value: string) {
    const transformationMode = transformationModes.find((mode) => mode === value);
    if (!transformationMode) return;
    setForm((current) => ({ ...current, transformationMode }));
  }

  function updateDietaryPreference(value: string) {
    const dietaryPreference = dietaryPreferences.find(
      (preference) => preference === value,
    );
    if (!dietaryPreference) return;
    setForm((current) => ({ ...current, dietaryPreference }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setResult(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/transform-recipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(90_000),
        body: JSON.stringify({
          ...form,
          recipe: form.recipe.trim() || form.dishName.trim(),
        }),
      });
      const responseText = await response.text();
      let payload: unknown;
      try {
        payload = JSON.parse(responseText);
      } catch {
        throw new Error(
          `The server returned an unreadable response (HTTP ${response.status}). Restart the Foodo API server and try again.`,
        );
      }

      if (!response.ok) {
        const message =
          typeof payload === "object" &&
          payload !== null &&
          "error" in payload &&
          typeof payload.error === "string"
            ? payload.error
            : "The recipe could not be transformed. Please try again.";
        throw new Error(message);
      }

      if (!isRecipeTransformation(payload)) {
        throw new Error(
          "The recipe response is missing required JSON fields. Please try again.",
        );
      }
      setResult(payload);
    } catch (requestError) {
      setError(
        requestError instanceof DOMException && requestError.name === "TimeoutError"
          ? "The recipe request took too long. Please try again."
          : requestError instanceof TypeError
            ? "Could not connect to the Foodo API. Start the server with npm run dev, then try again."
            : requestError instanceof Error
              ? requestError.message
              : "A network error occurred. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="Foodo home">
          <span className="brand-mark">f</span>
          <span>foodo</span>
        </a>
        <span className="topbar-note">Good food, made to fit you.</span>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow"><span className="eyebrow-dot" /> YOUR RECIPE, REIMAGINED</p>
          <h1>Make your favorite food work <em>for you.</em></h1>
          <p className="hero-description">
            Keep the flavors you love. Get a thoughtful recipe transformation
            built around your goals, not a one-size-fits-all diet.
          </p>
          <div className="hero-promise">
            <span aria-hidden="true">✳</span>
            Chef-inspired. Goal-aware. Still delicious.
          </div>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="art-sun" />
          <div className="art-plate">
            <div className="art-food art-food-one" />
            <div className="art-food art-food-two" />
            <div className="art-food art-food-three" />
            <div className="art-food art-food-four" />
            <div className="art-leaf">✦</div>
          </div>
          <span className="art-label">goodness, served</span>
        </div>
      </section>

      <section className="workspace" aria-label="Recipe transformation">
        <form className="form-card" onSubmit={handleSubmit}>
          <div className="card-heading">
            <span className="step-number">01</span>
            <div>
              <h2>Tell us what’s cooking</h2>
              <p>Start with a dish you already love.</p>
            </div>
          </div>

          <label className="field-label" htmlFor="dish-name">What dish should we transform?</label>
          <input
            id="dish-name"
            className="text-input"
            type="text"
            maxLength={120}
            placeholder="e.g. Chicken biryani, paneer wrap..."
            value={form.dishName}
            onChange={(event) => setForm({ ...form, dishName: event.target.value })}
            required
          />

          <label className="field-label recipe-label" htmlFor="recipe">
            Recipe details <span className="optional">(optional, but helpful)</span>
          </label>
          <textarea
            id="recipe"
            className="text-input recipe-input"
            maxLength={6000}
            placeholder="Paste ingredients and steps, or tell us what goes into it..."
            value={form.recipe}
            onChange={(event) => setForm({ ...form, recipe: event.target.value })}
          />

          <div className="section-divider" />

          <div className="card-heading goal-heading">
            <span className="step-number">02</span>
            <div>
              <h2>How should we transform it?</h2>
              <p>Choose a recipe mode and any dietary preference.</p>
            </div>
          </div>

          <label className="field-label" htmlFor="transformation-mode">Transformation mode</label>
          <select
            id="transformation-mode"
            className="text-input select-input"
            value={form.transformationMode}
            onChange={(event) =>
              updateTransformationMode(event.currentTarget.value)
            }
          >
            {transformationModes.map((mode) => <option key={mode} value={mode}>{mode}</option>)}
          </select>

          <label className="field-label secondary-label" htmlFor="dietary-preference">
            Dietary preference
          </label>
          <select
            id="dietary-preference"
            className="text-input select-input"
            value={form.dietaryPreference}
            onChange={(event) =>
              updateDietaryPreference(event.currentTarget.value)
            }
          >
            {dietaryPreferences.map((preference) => (
              <option key={preference} value={preference}>{preference}</option>
            ))}
          </select>

          <div className="section-divider" />

          <div className="card-heading goal-heading">
            <span className="step-number">03</span>
            <div>
              <h2>What is your goal?</h2>
              <p>Choose one primary goal and an optional secondary goal.</p>
            </div>
          </div>

          <label className="field-label" htmlFor="primary-goal">Primary goal</label>
          <select
            id="primary-goal"
            className="text-input select-input"
            value={form.primaryGoal}
            required
            onChange={(event) =>
              updatePrimaryGoal(event.currentTarget.value)
            }
          >
            <option value="" disabled>Select a primary goal</option>
            {goals.map((goal) => (
              <option key={goal.value} value={goal.value}>{goal.label}</option>
            ))}
          </select>

          <div className="targets-grid">
            <div>
              <label className="field-label" htmlFor="calorie-target">
                Calorie target <span className="optional">(optional)</span>
              </label>
              <input
                id="calorie-target"
                className="text-input"
                type="number"
                min="500"
                max="10000"
                step="50"
                placeholder="e.g. 600"
                value={form.calorieTarget ?? ""}
                onChange={(event) =>
                  setForm({
                    ...form,
                    calorieTarget: event.currentTarget.value === "" ? null : Number(event.currentTarget.value),
                  })
                }
              />
              <p className="field-hint">kcal per serving</p>
            </div>
            <div>
              <label className="field-label" htmlFor="protein-target">
                Protein target <span className="optional">(optional)</span>
              </label>
              <input
                id="protein-target"
                className="text-input"
                type="number"
                min="0"
                max="300"
                step="5"
                placeholder="e.g. 35"
                value={form.proteinTarget ?? ""}
                onChange={(event) =>
                  setForm({
                    ...form,
                    proteinTarget: event.currentTarget.value === "" ? null : Number(event.currentTarget.value),
                  })
                }
              />
              <p className="field-hint">grams per serving</p>
            </div>
          </div>

          <label className="field-label secondary-label" htmlFor="secondary-goal">
            Secondary goal <span className="optional">(optional)</span>
          </label>
          <select
            id="secondary-goal"
            className="text-input select-input"
            value={form.secondaryGoal}
            onChange={(event) =>
              updateSecondaryGoal(event.currentTarget.value)
            }
          >
            <option value="">No secondary goal</option>
            {goals
              .filter((goal) => goal.value !== form.primaryGoal)
              .map((goal) => (
                <option key={goal.value} value={goal.value}>{goal.label}</option>
              ))}
          </select>

          <div className="servings-row">
            <div>
              <label className="field-label" htmlFor="servings">Servings</label>
              <p className="field-hint">How many people are you cooking for?</p>
            </div>
            <div className="number-control">
              <button
                type="button"
                aria-label="Decrease servings"
                onClick={() => setForm({ ...form, servings: Math.max(1, form.servings - 1) })}
              >−</button>
              <output htmlFor="servings">{form.servings}</output>
              <button
                type="button"
                aria-label="Increase servings"
                onClick={() => setForm({ ...form, servings: Math.min(20, form.servings + 1) })}
              >+</button>
            </div>
            <input id="servings" className="sr-only" type="number" min="1" max="20" value={form.servings} readOnly />
          </div>

          <p className="form-note">
            We’ll focus on nutrition and practicality without losing the dish’s
            character or making it bland.
          </p>
          {error && <p className="error-message" role="alert">{error}</p>}
          <button className="submit-button" type="submit" disabled={isLoading} aria-busy={isLoading}>
            {isLoading ? (
              <><span className="spinner" /> Thinking up something delicious…</>
            ) : (
              <>Transform my recipe <span aria-hidden="true">↗</span></>
            )}
          </button>
        </form>

        <section className={`result-card${result ? " has-result" : ""}`} aria-live="polite">
          {result ? (
            <RecipeResult result={result} />
          ) : (
            <div className="empty-state">
              <div className="empty-illustration">
                <span className="empty-spark spark-one">✳</span>
                <span className="empty-bowl">⌣</span>
                <span className="empty-spark spark-two">✦</span>
              </div>
              <p className="result-kicker">YOUR NEXT FAVORITE</p>
              <h2>A little inspiration<br />is on its way.</h2>
              <p className="empty-copy">
                Your personalized recipe and nutrition breakdown will show up here.
              </p>
              <div className="empty-tags">
                <span>Thoughtful swaps</span>
                <span>Real flavor</span>
                <span>Your goals</span>
              </div>
            </div>
          )}
        </section>
      </section>
      <footer className="footer">
        <span>Made for the way you like to eat.</span>
        <span>Nutrition values are estimates, not medical advice.</span>
      </footer>
    </main>
  );
}

function RecipeResult({ result }: { result: RecipeTransformation }) {
  const changeLabel = {
    reduction: "less than original",
    increase: "more than original",
    similar: "about the same",
    unknown: "estimate unavailable",
  }[result.calorieChange.direction];
  const changeIcon = {
    reduction: "↘",
    increase: "↗",
    similar: "↔",
    unknown: "·",
  }[result.calorieChange.direction];
  const amount =
    result.calorieChange.amount === null
      ? null
      : `${result.calorieChange.amount} kcal`;

  return (
    <div className="result-content">
      <p className="result-kicker">YOUR PERSONALIZED RECIPE</p>
      <h2>{result.transformedDish}</h2>
      <p className="result-summary">{result.summary}</p>
      <div className="result-badges">
        <span>{result.servings} servings</span>
        <span>{result.recommendedServingSize} per serving</span>
      </div>

      <div className="nutrition-heading">
        <h3>Nutrition per serving</h3>
        <span>Estimated</span>
      </div>
      <div className="nutrition-grid">
        <NutritionItem label="Calories" value={`${result.nutrition.calories}`} unit="kcal" featured />
        <NutritionItem label="Protein" value={`${result.nutrition.proteinGrams}`} unit="g" />
        <NutritionItem label="Carbs" value={`${result.nutrition.carbohydratesGrams}`} unit="g" />
        <NutritionItem label="Fat" value={`${result.nutrition.fatGrams}`} unit="g" />
        <NutritionItem label="Fiber" value={`${result.nutrition.fiberGrams}`} unit="g" />
      </div>

      <div className="calorie-change">
        <span className="change-icon" aria-hidden="true">{changeIcon}</span>
        <div>
          <strong>
            {amount ?? "Calorie comparison"}{result.calorieChange.percentage === null ? "" : ` · ${result.calorieChange.percentage}%`}
          </strong>
          <span>{changeLabel} per serving vs. original</span>
        </div>
      </div>

      <section className="result-section">
        <h3>What we changed</h3>
        <ul className="change-list">
          {result.changes.map((change, index) => (
            <li key={`${index}-${change}`}><span>✓</span>{change}</li>
          ))}
        </ul>
      </section>
      <section className="result-section recipe-section">
        <h3>Ingredients</h3>
        <ul className="plain-list">
          {result.ingredients.map((ingredient, index) => <li key={`${index}-${ingredient}`}>{ingredient}</li>)}
        </ul>
      </section>
      <section className="result-section recipe-section">
        <h3>Let’s make it</h3>
        <ol className="steps-list">
          {result.instructions.map((instruction, index) => <li key={`${index}-${instruction}`}>{instruction}</li>)}
        </ol>
      </section>
      <p className="result-why">{result.whyItWorks}</p>
      <p className="estimate-note">{result.estimateNote}</p>
    </div>
  );
}

function NutritionItem({
  label,
  value,
  unit,
  featured = false,
}: {
  label: string;
  value: string;
  unit: string;
  featured?: boolean;
}) {
  return (
    <div className={`nutrition-item${featured ? " featured" : ""}`}>
      <span>{label}</span>
      <strong>{value}<small> {unit}</small></strong>
    </div>
  );
}

export default App;
