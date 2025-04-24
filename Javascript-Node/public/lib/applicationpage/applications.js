function handleDecision(applicationId, decision) {
    const applicationElement = document.getElementById(applicationId);
    if (decision === 'accepted') {
        applicationElement.style.backgroundColor = '#d4edda';
        applicationElement.style.borderColor = '#c3e6cb';
    } else if (decision === 'denied') {
        applicationElement.style.backgroundColor = '#f8d7da';
        applicationElement.style.borderColor = '#f5c6cb';
    }
    applicationElement.remove()
    applicationElement.innerHTML += `<p class="decision">Application ${decision}</p>`;
}
