<script>
  import TreeView from "./TreeView.svelte";
  import Login from "./Login.svelte";
  import { expansionState } from "./store/store";
  let selectedLabel = "",
    isLoggedIn = false;
  let tree = {
    label: "root",
    children: [
    ],
  };

  /* Resets all Expansion state to false, starting from root */
  const resetAllExpansionState = () => {
    expansionState.update((state) => {
      const updatedState = { ...state };
      for (const k in updatedState) {
        if (updatedState.hasOwnProperty(k)) {
          updatedState[k] = false;
        }
      }
      return updatedState;
    });
  };

  let name,
    selectedDirType = "File";

  /* Handler function to update Directory type dropdown */
  const handleDirTypeChange = (e) => {
    selectedDirType = e.target.value;
  };

  /* Creates new File / Folder Directory */
  const addNodeToTree = (t) => {
    let treeClone = { ...t };
    while (treeClone?.children?.length >= 0) {
      // If root element is the selected element
      if (treeClone.label === selectedLabel) {
        // If Children exists with same name
        if (treeClone?.children?.find((child) => child.label === name)) {
          alert("Object exists with same name");
          break;
        }
        // If selected Directory is File
        if (selectedDirType === "File") {
          // new file is last children
          treeClone.children.push({ label: name });
          alert(`Success : File ${name} created.`);
          name = "";
        }
        // If selected Directory is Folder
        if (selectedDirType === "Folder") {
          // If Subfolder exists
          if (treeClone?.children.find((child) => !!child.children)) {
            alert("Can't add more than 1 Folder in a Directory");
            break;
          }
          // new folder is always first children
          treeClone.children.unshift({ label: name, children: [] });
          alert(`Success : Folder ${name} created.`);
          name = "";
        }
        break;
      }
      // Find Child Element with same label
      else {
        // First Child will always be Folder so check for the selected
        // label in first child node
        addNodeToTree(treeClone.children[0]);
        return treeClone;
      }
    }
    return treeClone;
  };

  /* Handler for Click on Save Button */
  const handleSaveBtnClick = () => {
    tree = addNodeToTree(tree);
    resetAllExpansionState();
  };
</script>

<main>
  {#if !isLoggedIn}
    <Login bind:isLoggedIn />
  {/if}
  {#if isLoggedIn}
    <header class="app-header">
      <button
        type="button"
        on:click={() => {
          isLoggedIn = false;
        }}>Logout</button
      >
    </header>
    <section class="input-section">
      <label for="name">Name : </label>
      <input type="text" name="name" id="name" bind:value={name} />
      <select
        name="dirtype"
        id="dirtype"
        on:change={handleDirTypeChange}
        value={selectedDirType}
      >
        <option value="File">File</option>
        <option value="Folder">Folder</option>
      </select>
      <button
        type="button"
        disabled={selectedLabel.trim() === "" ? true : false}
        on:click={handleSaveBtnClick}>Save</button
      >
      <button
        type="button"
        on:click={() => {
          name = "";
          selectedLabel = "";
        }}>Cancel</button
      >
      {#if selectedLabel === ""}
        <h5 class="instruction-heading">Instructions</h5>
        <ul>
          <li>Please Click on Folder Name below to Select a Folder</li>
          <li>
            Please Click on Arrow icon to before Name to Expand or Close the
            Folder
          </li>
        </ul>
      {/if}
      {#if selectedLabel !== ""}
        <p>Selected Folder : <b>{selectedLabel}</b></p>
      {/if}
    </section>
    <section class="display-section">
      <hr />
      <p class="directory-heading">Directory Structure :</p>
      <TreeView bind:tree bind:selectedLbl={selectedLabel} />
    </section>
  {/if}
</main>

<style>
  .input-section {
    max-width: fit-content;
    margin: auto;
    padding-top: 5rem;
  }

  .display-section {
    padding-top: 1rem;
  }

  .directory-heading {
    padding-left: 2rem;
    font-weight: bold;
  }

  .app-header {
    margin: 0 2rem;
    margin-top: 1rem;
    display: flex;
    justify-content: end;
  }

  .instruction-heading {
    margin: 0.5rem auto;
    padding-top: 1rem;
  }
</style>
